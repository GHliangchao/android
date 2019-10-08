package com.tuidian.tech.zma.lock;

import static com.inuker.bluetooth.library.Constants.REQUEST_SUCCESS;
import static com.inuker.bluetooth.library.Constants.STATUS_CONNECTED;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_CLOCK;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_HANDS;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_LOCAT;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_MODKEY;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_OLOCK;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_RCODE;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_RESET;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_UPGSWT;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_WCODE;
import static com.tuidian.tech.zma.lock.protocol.Packet.STATUS_FAULTED;
import static com.tuidian.tech.zma.lock.protocol.Packet.STATUS_VINCOMP;
import static com.tuidian.tech.zma.lock.util.Logger.debug;
import static com.tuidian.tech.zma.lock.util.Logger.debugf;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.gc.nfc.ui.ReadActivity;
import com.gc.nfc.ui.ReadNfcActivity;
import com.gc.nfc.ui.ReadSecretCodeActivity;
import com.gc.nfc.ui.WriteActivity;
import com.gc.nfc.ui.WriteNfcActivity;
import com.inuker.bluetooth.library.BluetoothClient;
import com.inuker.bluetooth.library.beacon.Beacon;
import com.inuker.bluetooth.library.beacon.BeaconItem;
import com.inuker.bluetooth.library.beacon.BeaconParser;
import com.inuker.bluetooth.library.connect.listener.BleConnectStatusListener;
import com.inuker.bluetooth.library.connect.options.BleConnectOptions;
import com.inuker.bluetooth.library.connect.response.BleConnectResponse;
import com.inuker.bluetooth.library.connect.response.BleNotifyResponse;
import com.inuker.bluetooth.library.connect.response.BleWriteResponse;
import com.inuker.bluetooth.library.model.BleGattProfile;
import com.inuker.bluetooth.library.search.SearchRequest;
import com.inuker.bluetooth.library.search.SearchResult;
import com.inuker.bluetooth.library.search.response.SearchResponse;
import com.inuker.bluetooth.library.utils.BluetoothUtils;
import com.tuidian.tech.zma.lock.protocol.CloseLock;
import com.tuidian.tech.zma.lock.protocol.Handshake;
import com.tuidian.tech.zma.lock.protocol.HandshakeResponse;
import com.tuidian.tech.zma.lock.protocol.Locate;
import com.tuidian.tech.zma.lock.protocol.LocateResponse;
import com.tuidian.tech.zma.lock.protocol.ModifyKey;
import com.tuidian.tech.zma.lock.protocol.OpenLock;
import com.tuidian.tech.zma.lock.protocol.Packet;
import com.tuidian.tech.zma.lock.protocol.ProtocolException;
import com.tuidian.tech.zma.lock.protocol.ReadZcode;
import com.tuidian.tech.zma.lock.protocol.ReadZcodeResponse;
import com.tuidian.tech.zma.lock.protocol.ResetLock;
import com.tuidian.tech.zma.lock.protocol.Response;
import com.tuidian.tech.zma.lock.protocol.SwitchUpgrade;
import com.tuidian.tech.zma.lock.protocol.WriteZcode;
import com.tuidian.tech.zma.lock.protocol.Zcode;
import com.tuidian.tech.zma.lock.util.ByteUtil;
import com.tuidian.tech.zma.lock.util.Md5PwdEncoder;
import com.tuidian.tech.zma.lock.util.SecurityUtil;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.nfc.NfcAdapter;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;

import io.dcloud.common.DHInterface.IApp;
import io.dcloud.common.DHInterface.ISysEventListener;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.StandardFeature;
import io.dcloud.common.util.JSUtil;

/**
 * 甄码锁访问插件。
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月2日
 *
 */
public class BleLockFeatureImpl extends StandardFeature {
	
	final static String TAG = "blelock";
	final static String MD5_KEY = "~$!zhenmamg20190306!@$";
	
	final static String UUID_SUFFIX= "-0000-1000-8000-00805F9B34FB";
	final static UUID UUID_SERVICE = UUID.fromString("0000FEE7" + UUID_SUFFIX);
	final static UUID UUID_CNOTIFY = UUID.fromString("000036F6" + UUID_SUFFIX);
	final static UUID UUID_CWRITE  = UUID.fromString("000036F5" + UUID_SUFFIX);
	
	// 加密透传属性 since 2018-03-17 pzp
	final static String KEY_BODY = "packetBody", KEY_PLEN = "plainLength";
	// NFC参数属性 since 2018-03-17 pzp
	final static String KEY_NFC_ID = "cardId", KEY_NFC_FMT= "format", KEY_NFC_DAT = "data";
	// NFC requestCode @since 2018-07-31 liujun
	final static int REQ_OK = 1, RES_OK = 2, BACK_CLICK = 0;
	
	private Handler uiHandler;
	
	// Connection management
	private BluetoothDevice device;
	private IWebview webview;
	private String connectCb;
	
	// Protocol support
	private Packet command, commandResponse;
	private String commandCb;
	
	// Protocol debug
	private final SimulatedLock simLock = /*new SimulatedLock()*/null;
	
	// NFC support
	private Activity self;
	private NfcAdapter nfcAdapter;
	private String nfcCb;
	
	public BleLockFeatureImpl(){
		System.setProperty(Consts.PROP_DEBUG, "true");
		debugf(TAG, "New(): bleF#%s", hashCode());
	}
	
	// business
	public void scan(final IWebview webview, final JSONArray params) {
		debugf(TAG, "scan() - params = %s", params);
		final String callback = params.optString(0);
		final int period, argc = params.length();
		if(argc > 1){
			period = getInt(params, 1, 12000);
		}else{
			period = 12000;
		}

		applyPermission(webview);
		tryOpenBluetooth();
		
		final SearchResponse response = new SearchResponse() {
			
			final List<SearchResult> devices = new ArrayList<SearchResult>();
			
	        @Override
	        public void onSearchStarted() {
	            debug(TAG, "onSearchStarted()");
	        }

	        @Override
	        public void onDeviceFounded(final SearchResult device) {
	            debugf(TAG, "onDeviceFounded(): mac = %s", device.device);
	            String name = device.getName();
	            if (!devices.contains(device)) {
	                devices.add(device);
	                try{
	                	// Parse MANU data
	                	int status = -1;
	                	String code= "";
	                	final Beacon beacon = new Beacon(device.scanRecord);
	                	for(final BeaconItem i : beacon.mItems){
	                		switch(i.type){
	                		case 0x09:
	                			if("NULL".equals(name)){
	                				name = new String(i.bytes);
	                			}
	                			break;
	                		case 0xFF:
	                			final int size = i.bytes.length;
	                			if(size < 7){
	                				break;
	                			}
	                			// status, MAC, zcode
	                			final BeaconParser parser = new BeaconParser(i);
	                			status = parser.readByte();
	                			// skip MAC
	                			parser.setPosition(7);
	                			// read code
	                			if(size > 7){
	                				final byte[] buf = Zcode.newBuffer();
	                				for(int j = 0; j < buf.length && j + 7 < size; ++j){
	                					buf[j] = (byte)parser.readByte();
	                				}
	                				code = Zcode.decode(buf);
	                			}
	                			break;
	                		}
	                	}
	                	// Filter by "M+G" device
	                	if(name == null || name.startsWith("M+G")==false){
	                		return;
	                	}
	                	// result
						final JSONObject disco = new JSONObject()
						.put("address", device.getAddress())
						.put("name", name)
						.put("rssi", device.rssi)
						// add since 2018-03-06 pzp
						.put("status", status)
						.put("code", code);
						final JSONObject json  = new JSONObject()
						.put("device", disco);
						success(webview, callback, "", json, true);
					}catch(final JSONException e){}
	            }
	        }

	        @Override
	        public void onSearchStopped() {
	            debug(TAG, "onSearchStopped()");
	            onSearchOver();
	        }

	        @Override
	        public void onSearchCanceled() {
	        	debug(TAG, "onSearchCanceled()");
	        	onSearchOver();
	        }
	        
	        private final void onSearchOver(){
	        	devices.clear();
	        	error(webview, callback, Consts.ER_TIMEOUT, "");
	        }
	        
	    };
		final SearchRequest request = new SearchRequest.Builder()
        				.searchBluetoothLeDevice(period, 1).build();
		BleClientManager.getClient().search(request, response);
		
		if(simLock != null){
			response.onDeviceFounded(simLock.getSearchResult());
		}
		
	}
	
	public void stopScan(final IWebview webview, final JSONArray params) {
		debug(TAG, "stopScan()");
		final String callback = params.optString(0);
		BleClientManager.getClient().stopSearch();
		success(webview, callback, "已停止扫描");
	}
	
	public void connect(final IWebview webview, final JSONArray params){
		debugf(TAG, "connect(): params = %s", params);
		final String callback = params.optString(0);
		try{
			final JSONObject request = params.getJSONObject(1);
			final String address = request.getString("address");
			int timeo = isSimulated(address)? 1: 7;
			if(params.length() > 2){
				final int sec = getInt(params, 2);
				if(sec != 0){
					timeo = sec;
				}
			}
			if(BluetoothAdapter.checkBluetoothAddress(address) == false){
				error(webview, callback, Consts.ER_ERROR, "地址格式错误");
				return;
			}
			if(this.connectCb != null){
				error(webview, callback, Consts.ER_ERROR, "上次连接未完成");
				return;
			}
			if(this.device != null){
				if(address.equals(device.getAddress())){
					this.connectCb = callback;
					onConnectionCompleted("已连接");
					return;
				}
				cleanupConnection();
			}
			final BluetoothClient cli = BleClientManager.getClient();
			cli.registerConnectStatusListener(address, connectStatusListener);
			this.device = BluetoothUtils.getRemoteDevice(address);
			this.webview = webview;
			this.connectCb = callback;
			connectDeviceIfNeeded(timeo);
		}catch(final JSONException e){
			debugf(TAG, "connect(): error = %s", e);
			error(webview, callback, Consts.ER_ERROR, "参数错误");
			return;
		}
	}
	
	public void disconnect(final IWebview webview, final JSONArray params) {
		debugf(TAG, "disconnect(): params = %s", params);
		cleanupConnection();
		final String callback = params.optString(0);
		success(webview, callback, "已断开连接");
	}
	
	public void handshake(final IWebview webview, final JSONArray params){
		// params: [callback, request]
		debugf(TAG, "handshake(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		int request = 0;
		if(params.length() > 1){
			request = getInt(params, 1, 0);
		}
		final Handshake cmd = new Handshake();
		command = cmd;
		postTimeoutHandler(cmd);
		cmd.setRequest(cmd.getRequest()|request);
		write(cmd.serialize());
	}
	
	public void readZcode(final IWebview webview, final JSONArray params){
		// params: [callback]
		debugf(TAG, "readZcode(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final ReadZcode cmd = new ReadZcode();
		command = cmd;
		postTimeoutHandler(cmd);
		write(cmd.serialize());
	}
	
	public void closeLock(final IWebview webview, final JSONArray params){
		// params: [callback, timeout]
		debugf(TAG, "closeLock(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		int timeout = 30;
		if(params.length() > 1){
			int sec = getInt(params, 1, timeout);
			if(sec > 0){
				timeout = sec;
			}
		}
		final CloseLock cmd = new CloseLock();
		command = cmd;
		postTimeoutHandler(timeout, cmd);
		write(cmd.serialize());
	}
	
	public void locate(final IWebview webview, final JSONArray params){
		// params: [callback, timeout]
		debugf(TAG, "locate(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		int timeout = 30;
		if(params.length() > 1){
			int sec = getInt(params, 1, timeout);
			if(sec > 0){
				timeout = sec;
			}
		}
		final Locate cmd = new Locate();
		command = cmd;
		postTimeoutHandler(timeout, cmd);
		write(cmd.serialize());
	}
	
	public void wzcode(final IWebview webview, final JSONArray params) {
		// params: [callback, zcode]
		debugf(TAG, "wzcode(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final JSONObject zcode = params.optJSONObject(1);
		if(zcode == null){
			safeError(Consts.ER_ERROR, "Arguments error: no zcode");
			return;
		}
		final boolean encrypted = zcode.optBoolean("encrypted", false);
		final WriteZcode cmd = new WriteZcode(encrypted);
		try{
			if(encrypted){
				handleEncryptedParams(cmd, zcode);
			}
			if(!encrypted || cmd.getBody() == null){
				final String zcSign = getZcodeSign(cmd, zcode, "lastPlainKey");
				cmd.setZcSign(zcSign);
				cmd.setCaName(zcode.getString("caName"));
				cmd.setCertSn(zcode.getString("certSn"));
				cmd.setZcKey(zcode.getString("zcKey"));
				cmd.setZcode(zcode.getString("zcode"));
				cmd.setZcTime(zcode.getLong("zcTime"));
				cmd.setZcTitle(zcode.getString("zcTitle"));
				cmd.setZcUsername(zcode.getString("zcUsername"));
				tryEncrypt(cmd, encrypted);
			}
			command = cmd;
			postTimeoutHandler(cmd);
			write(cmd.serialize());
		}catch(final JSONException e){
			debugf(TAG, "wzcode(): args error = %s", e);
			safeError(Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
	}
	
	public void openLock(final IWebview webview, final JSONArray params) {
		// params: [callback, zcode]
		debugf(TAG, "openLock(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final JSONObject zcode = params.optJSONObject(1);
		if(zcode == null){
			safeError(Consts.ER_ERROR, "Arguments error: no zcode");
			return;
		}
		final boolean encrypted = zcode.optBoolean("encrypted", false);
		final OpenLock cmd = new OpenLock(encrypted);
		try{
			if(encrypted){
				handleEncryptedParams(cmd, zcode);
			}
			if(!encrypted || cmd.getBody() == null){
				final String zcSign = getZcodeSign(cmd, zcode, "zcPlainKey");
				cmd.setZcSign(zcSign);
				tryEncrypt(cmd, encrypted);
			}
			command = cmd;
			postTimeoutHandler(cmd);
			write(cmd.serialize());
		}catch(final JSONException e){
			debugf(TAG, "openLock(): args error = %s", e);
			safeError(Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
	}
	
	public void resetLock(final IWebview webview, final JSONArray params) {
		// params: [callback, zcode]
		debugf(TAG, "resetLock(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final JSONObject zcode = params.optJSONObject(1);
		if(zcode == null){
			safeError(Consts.ER_ERROR, "Arguments error: no zcode");
			return;
		}
		final boolean encrypted = zcode.optBoolean("encrypted", false);
		final ResetLock cmd = new ResetLock(encrypted);
		try{
			if(encrypted){
				handleEncryptedParams(cmd, zcode);
			}
			if(!encrypted || cmd.getBody() == null){
				final String zcSign = getZcodeSign(cmd, zcode, "zcPlainKey");
				cmd.setZcSign(zcSign);
				tryEncrypt(cmd, encrypted);
			}
			command = cmd;
			postTimeoutHandler(cmd);
			write(cmd.serialize());
		}catch(final JSONException e){
			debugf(TAG, "resetLock(): args error = %s", e);
			safeError(Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
	}
	
	public void switchUpgrade(final IWebview webview, final JSONArray params) {
		// params: [callback, options]
		debugf(TAG, "switchUpgrade(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final JSONObject options = params.optJSONObject(1);
		if(options == null){
			safeError(Consts.ER_ERROR, "Arguments error: no options");
			return;
		}
		final boolean encrypted = options.optBoolean("encrypted", false);
		try{
			final SwitchUpgrade cmd = new SwitchUpgrade(encrypted);
			if(encrypted){
				handleEncryptedParams(cmd, options);
			}
			if(!encrypted || cmd.getBody() == null){
				final String lockSign = getLockSign(cmd, options);
				cmd.setLockSign(lockSign);
				tryEncrypt(cmd, encrypted);
			}
			command = cmd;
			postTimeoutHandler(cmd);
			write(cmd.serialize());
		}catch(final JSONException e){
			debugf(TAG, "switchUpgrade(): args error = %s", e);
			safeError(Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
	}
	
	public void modifyKey(final IWebview webview, final JSONArray params) {
		// params: [callback, options]
		debugf(TAG, "modifyKey(): params = %s", params);
		if(init(webview, params.optString(0))){
			return;
		}
		final JSONObject options = params.optJSONObject(1);
		if(options == null){
			safeError(Consts.ER_ERROR, "Arguments error: no options");
			return;
		}
		final boolean encrypted = options.optBoolean("encrypted", false);
		try{
			final ModifyKey cmd = new ModifyKey(encrypted);
			if(encrypted){
				handleEncryptedParams(cmd, options);
			}
			if(!encrypted || cmd.getBody() == null){
				final String lockSign = getLockSign(cmd, options);
				cmd.setLockSign(lockSign);
				String lockKey = options.optString("lockKey", "");
				if(lockKey.length() == 0 && cmd.isTest()){
					lockKey = Consts.LOCKEY_DEF;
				}
				if(lockKey.length() != Packet.AES_BLKS){
					safeError(Consts.ER_ERROR, "Arguments error: lockKey length must be 16");
					return;
				}
				cmd.setLockKey(lockKey);
				tryEncrypt(cmd, encrypted);
			}
			command = cmd;
			postTimeoutHandler(cmd);
			write(cmd.serialize());
		}catch(final JSONException e){
			debugf(TAG, "modifyKey(): args error = %s", e);
			safeError(Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
	}
	
	public void nfcCheck(final IWebview webview, final JSONArray params) {
		// params: [callback]
		debugf(TAG, "nfcCheck(): params = %s", params);
		final String callback = params.optString(0);
		// check NFC
		if(nfcAdapter(webview) != null){
			success(webview, callback, Consts.ER_NONE, "NFC supported");
			return;
		}
		error(webview, callback, Consts.ER_NONFC, "NFC not supported");
	}
	
	// + NFC access since 1.6.3-20180319 pzp
	public void nfcRead(final IWebview webview, final JSONArray params) {
		// params: [callback, options]
		debugf(TAG, "nfcRead(): params = %s", params);
		final String callback = params.optString(0);
		final JSONObject options = params.optJSONObject(1);
		if(options == null){
			error(webview, callback, Consts.ER_ERROR, "Arguments error: no options");
			return;
		}
		final String cardId, format;
		try {
			format = nfcParseArgFormat(webview, callback, options);
			if(format == null){
				return;
			}
			cardId = options.getString(KEY_NFC_ID);
			debugf(TAG, "nfcRead(): cardId = %s", cardId);
		} catch (final JSONException e) {
			debugf(TAG, "nfcRead(): args error = %s", e);
			error(webview, callback, Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
		// Access NFC
		nfcAdapter = nfcAdapter(webview);
		if(nfcAdapter == null){
			error(webview, callback, Consts.ER_NONFC, "NFC not supported");
			return;
		}
//		if(isSimulated(cardId)){
//			final byte[] buf = simLock.nfcRead();
//			final String data= ByteUtil.dump(buf, format);
//			success(webview, callback, Consts.ER_NONE, data);
//			return;
//		}
		//error(webview, callback, Consts.ER_ERROR, "NFC not implemented");
		this.webview = webview;
		this.nfcCb   = callback;
		this.self    = webview.getActivity();
		startNfc(nfcAdapter, true, format, null);
	}
	
	public void nfcWrite(final IWebview webview, final JSONArray params) {
		// params: [callback, options]
		debugf(TAG, "nfcWrite(): params = %s", params);
		final String callback = params.optString(0);
		final JSONObject options = params.optJSONObject(1);
		if(options == null){
			error(webview, callback, Consts.ER_ERROR, "Arguments error: no options");
			return;
		}
		final String cardId, format, data;
		try {
			format = nfcParseArgFormat(webview, callback, options);
			if(format == null){
				return;
			}
			cardId = options.getString(KEY_NFC_ID);
			data   = options.optString(KEY_NFC_DAT, "");
			debugf(TAG, "nfcWrite(): cardId = %s, data = %s", cardId, data);
		} catch (final JSONException e) {
			debugf(TAG, "nfcWrite(): args error = %s", e);
			error(webview, callback, Consts.ER_ERROR, "Arguments error: " + e);
			return;
		}
		// Access NFC
		nfcAdapter = nfcAdapter(webview);
		if(nfcAdapter == null){
			error(webview, callback, Consts.ER_NONFC, "NFC not supported");
			return;
		}
//		if(isSimulated(cardId)){
//			final byte[] buf = ByteUtil.parse(data, format);
//			simLock.nfcWrite(buf);
//			success(webview, callback, Consts.ER_NONE, "OK");
//			return;
//		}
		//error(webview, callback, Consts.ER_ERROR, "NFC not implemented");
		this.webview = webview;
		this.nfcCb   = callback;
		this.self    = webview.getActivity();
		startNfc(nfcAdapter, false, format, data);
	}
	
	// scan QRcode write/read NFC @since liujun 2018-07-31
	public void scanQRcodeNfcWrite(final IWebview webview, final JSONArray params) {
        // params: [callback, options]
        debugf(TAG, "nfcWrite(): params = %s", params);
        final String callback = params.optString(0);
        final JSONObject options = params.optJSONObject(1);
        if(options == null){
            error(webview, callback, Consts.ER_ERROR, "Arguments error: no options");
            return;
        }
        final String format = nfcParseArgFormat(webview, callback, options);
        if(format == null){
            return;
        }
        final String data = options.optString(KEY_NFC_DAT, "");
        debugf(TAG, "nfcWrite(): data = %s", data);
        // Access NFC
        nfcAdapter = nfcAdapter(webview);
        if(nfcAdapter == null){
            error(webview, callback, Consts.ER_NONFC, "NFC not supported");
            return;
        }
        this.webview = webview;
        this.nfcCb   = callback;
        this.self    = webview.getActivity();
        startQrcodeNfc(nfcAdapter, false, format, data);
        register();
    }
	
	public void scanQRcodeNfcRead(final IWebview webview, final JSONArray params) {
        // params: [callback, options]
        debugf(TAG, "scan QRcode read NFC: params = %s", params);
        final String callback = params.optString(0);
        final JSONObject options = params.optJSONObject(1);
        if (options == null) {
            error(webview, callback, Consts.ER_ERROR, "Arguments error: no options");
            return;
        }
        final String format = nfcParseArgFormat(webview, callback, options);
        if (format == null) {
            return;
        }
        debugf(TAG, "scan QRcode read NFC: format = %s", format);
        // Access NFC
        nfcAdapter = nfcAdapter(webview);
        if (nfcAdapter == null) {
            error(webview, callback, Consts.ER_NONFC, "NFC not supported");
            return;
        }
        this.webview = webview;
        this.nfcCb = callback;
        this.self = webview.getActivity();
        startQrcodeNfc(nfcAdapter, true, format, null);
        register();
    }
	
	// + scan secret code NFC @since liujun 2019-02-28
	public void scanSecretCodeNfcRead(final IWebview webview, final JSONArray params) {
		// params: [callback, options]
        debugf(TAG, "scan NFC read secret code: params = %s", params);
        final String callback = params.optString(0);
        final JSONObject options = params.optJSONObject(1);
        if (options == null) {
        	error(webview, callback, Consts.ER_ERROR, "Arguments error: no options");
        }
        // Access NFC
        nfcAdapter = nfcAdapter(webview);
        if(nfcAdapter == null) {
        	error(webview, callback, Consts.ER_NONFC, "NFC not supported");
        	return;
        }
        this.webview = webview;
        this.nfcCb = callback;
        this.self = webview.getActivity();
        startScanSecretCodeNfc(nfcAdapter);
        registerSecretCodeReadNFC();
	}
	
	private void registerSecretCodeReadNFC(){
	    final IApp app = webview.obtainFrameView().obtainApp();
        app.registerSysEventListener(new ISysEventListener() {
            @Override
            public boolean onExecute(SysEventType pEventType, Object pArgs) {
                Object[] _args = (Object[])pArgs;
                int requestCode = (Integer)_args[0];
                int resultCode = (Integer)_args[1];
                debug(TAG, "onActivity back result is "+requestCode+" ---- "+ resultCode);
                Intent data = (Intent)_args[2];
                if(pEventType == SysEventType.onActivityResult){
                    app.unregisterSysEventListener(this, SysEventType.onActivityResult);
                    if(RES_OK == resultCode){
                        final String codeSn = data.getStringExtra("codeSn");
                        final String code = data.getStringExtra("code");
                        final String version = data.getStringExtra("version");
                        final String digest = data.getStringExtra("digest");
                    	final long ts = System.currentTimeMillis();
                        debug(TAG, "callback message is ", codeSn, code, version);
                        
                        try{
                        	final String sign = encryptParam(code, codeSn, version, ts);
	                        final JSONObject info = new JSONObject();
	                        info.put("codeSn", codeSn);
	                        info.put("code", code);
	                        info.put("version", version);
	                        info.put("ts", ts);
	                        info.put("sign", sign);
	                        info.put("digest", digest);
                            success(webview, nfcCb, "SUCCESS", info, false);
                        } catch (Exception e) {
                        }finally{
                            cleanupNfc();
                        }
                    }
                    if (BACK_CLICK == resultCode) {
                        try{
                            success(webview, nfcCb, Consts.ER_NONE, "backclick");
                        }finally{
                            cleanupNfc();
                        }
                    }
                }
                return false;
            }
        }, SysEventType.onActivityResult);
	}
	
	public static String encryptParam(String code, String codeSn, String version, long ts) {
		String encryptParam = "code="+code+"&codeSn="+codeSn+"&md5_key="+MD5_KEY
							+ "&ts="+ts+"&version="+version;
		debug(TAG, "md5 encrypt param : "+ encryptParam);
		String sign = Md5PwdEncoder.passwordEncode(encryptParam);
		debug(TAG, "md5 encrypt param result: " + sign);
		return sign;
	}
	
	private void register(){
	    final IApp app = webview.obtainFrameView().obtainApp();
        app.registerSysEventListener(new ISysEventListener() {
            @Override
            public boolean onExecute(SysEventType pEventType, Object pArgs) {
                Object[] _args = (Object[])pArgs;
                int requestCode = (Integer)_args[0];
                int resultCode = (Integer)_args[1];
                debug(TAG, "onActivity back result is "+requestCode+" ---- "+ resultCode);
                Intent data = (Intent)_args[2];
                if(pEventType == SysEventType.onActivityResult){
                    app.unregisterSysEventListener(this, SysEventType.onActivityResult);
                    if(RES_OK == resultCode){
                        final String message = data.getStringExtra("KEY");
                        debug(TAG, "callback message is " + message);
                        try{
                            success(webview, nfcCb, Consts.ER_NONE, message);
                        }finally{
                            cleanupNfc();
                        }
                    }
                    if (BACK_CLICK == resultCode) {
                        try{
                            success(webview, nfcCb, Consts.ER_NONE, "backclick");
                        }finally{
                            cleanupNfc();
                        }
                    }
                }
                return false;
            }
        }, SysEventType.onActivityResult);
	}
	
	private void startScanSecretCodeNfc(NfcAdapter nfcAdapter){
	    if(nfcAdapter != null){
            final Intent intent = new Intent(self, ReadSecretCodeActivity.class);
            intent.putExtra("format", "text");
            self.startActivityForResult(intent, REQ_OK);
        }
	}
	
	private void startQrcodeNfc(NfcAdapter nfcAdapter, final boolean nfcRead, final String format, final String data){
	    if(nfcAdapter != null){
            final Intent intent;
            if(nfcRead){
                intent = new Intent(self, ReadNfcActivity.class);
            }else{
                intent = new Intent(self, WriteNfcActivity.class);
                intent.putExtra("data", data);
            }
            intent.putExtra("format", format);
            self.startActivityForResult(intent, REQ_OK);
        }
	}
	
	private void startNfc(NfcAdapter nfcAdapter, final boolean nfcRead, final String format, final String data){
		if(nfcAdapter != null){
			final Intent intent;
			if(nfcRead){
				intent = new Intent(self, ReadActivity.class);
			}else{
				intent = new Intent(self, WriteActivity.class);
				intent.putExtra("data", data);
			}
			intent.putExtra("format", format);
			self.startActivity(intent);
			nfcSuccess();
		}
	}
	
	private void nfcSuccess(){
		try{
			success(webview, nfcCb, Consts.ER_NONE, "");
		}finally{
			cleanupNfc();
		}
	}
	
	private void cleanupNfc(){
		if (nfcAdapter != null){
			self  = null;
			nfcCb = null;
			webview = null;
			nfcAdapter = null;
		}
	}
	
	private final NfcAdapter nfcAdapter(final IWebview webview){
		final Activity activity = webview.getActivity();
		return (NfcAdapter.getDefaultAdapter(activity));
	}
	
	private final String nfcParseArgFormat(IWebview webview, String callback, JSONObject options){
		String dataf = options.optString(KEY_NFC_FMT, Consts.NFC_FMT_TXT);
		if(dataf.length() == 0){
			dataf = Consts.NFC_FMT_TXT;
		}
		final String format = dataf;
		if(!Consts.NFC_FMT_TXT.equalsIgnoreCase(format) && !Consts.NFC_FMT_HEX.equalsIgnoreCase(format)){
			error(webview, callback, Consts.ER_ERROR, "Arguments error: format must be "+
					Consts.NFC_FMT_TXT+" or "+Consts.NFC_FMT_HEX);
			return null;
		}
		return format;
	}
	
	private Packet handleEncryptedParams(final Packet cmd, final JSONObject options) throws JSONException {
		final String body = options.optString(KEY_BODY, "");
		if(body.length() != 0){
			cmd.setLength(options.getInt(KEY_PLEN));
			cmd.setBody(body);
		}
		return cmd;
	}
	
	private Packet tryEncrypt(final Packet cmd, final boolean encrypted){
		if(encrypted && cmd.isTest()){
			cmd.setLockKey(Consts.LOCKEY_DEF);
			cmd.encrypt();
		}
		return cmd;
	}
	
	private String getLockSign(final Packet cmd, JSONObject options) {
		final String lockSign = options.optString("lockSign", "");
		if(lockSign.length() == 0){
			// Note: only generate lock sign in app when test!
			cmd.setTest(true);
			final String seed = options.optString("seed", "");
			if(seed.length() != 8){
				throw new IllegalArgumentException("seed length must be 8");
			}
			return (SecurityUtil.sha1Sign(Consts.LOCKEY_DEF, cmd.hexId()+seed));
		}
		return lockSign;
	}

	private final String getZcodeSign(final Packet cmd, final JSONObject zcode, final String keyName){
		final String plainKey = zcode.optString(keyName, "");
		if(plainKey.length() > 0){
			// Note: only use plainKey when test!
			cmd.setTest(true);
			final String seed = zcode.optString("seed", "");
			if(seed.length() != 8){
				throw new IllegalArgumentException("seed length must be 8");
			}
			return (SecurityUtil.sha1Sign(plainKey, cmd.hexId()+seed));
		}
		final String zcsDefault = "0000000000000000000000000000000000000000";
		final String sign = zcode.optString("zcSign", "");
		if(sign.length() == 0 || zcsDefault.equals(sign)){
			cmd.setTest(true);
			return zcsDefault;
		}
		return sign;
	}
	
	private Runnable postTimeoutHandler(final Packet cmd){
		return postTimeoutHandler(7, cmd);
	}
	
	private Runnable postTimeoutHandler(final int timeout, final Packet cmd){
		final Runnable handler = new Runnable(){
			@Override
			public void run() {
				if(command == cmd){
					try{
						cmd.setTimeoutHandler(null);
						error(webview, commandCb, Consts.ER_TIMEOUT, "已超时");
					}finally{
						cleanupConnection();
					}
				}
			}
		};
		uiHandler.postDelayed(handler, timeout * 1000L);
		cmd.setTimeoutHandler(handler);
		return handler;
	}
	
	private final boolean init(final IWebview webview, final String callback){
		if(command != null){
			error(webview, callback, Consts.ER_PENDING, "Last operation pending");
			return true;
		}
		this.webview  = webview;
		this.commandCb= callback;
		return (checkConnect());
	}
	
	private void write(final Packet p){
		if(p.hasRemaining()){
			final byte[] block = Packet.newBlockBuffer();
			p.readBytes(block);
			final BleWriteResponse response = new BleWriteResponse() {
		        @Override
		        public void onResponse(final int code) {
		            if (code == REQUEST_SUCCESS || isSimulated()) {
		            	if(isSimulated()){
		            		notifyResponse.onNotify(UUID_SERVICE, UUID_CNOTIFY, simLock.notifyData());
		            	}
		            	write(p);
		            } else {
		            	try{
		            		error(webview, commandCb, Consts.ER_ERROR, "写数据出错");
		            	}finally{
		            		cleanupCommand();
		            	}
		            }
		        }
		    };
			final BluetoothClient cli = BleClientManager.getClient();
			cli.write(device.getAddress(), UUID_SERVICE, UUID_CWRITE, block, response);
			if(Consts.DEBUG){
				debugf(TAG, "write(): Write a block ->\n%s\n<-", ByteUtil.dumphex(block));
			}
			if(isSimulated()){
				simLock.onRead(block);
			}
			return;
		}
		for(; isSimulated(); ){
			final byte[] block = simLock.notifyData();
			if(block == null){
				break;
			}
    		notifyResponse.onNotify(UUID_SERVICE, UUID_CNOTIFY, block);
    	}
		// Success when upgrade command sent after 1.5s since 2018-04-08 pzp
		uiHandler.postDelayed(new Runnable(){
			@Override
			public void run() {
				final Packet cmd = command;
		    	if(cmd != null && cmd.id==Packet.CMD_UPGSWT){
		    		try{
		    			success(webview, commandCb, "OK");
		    		}finally{
		    			cleanupConnection();
		    		}
		    	}
			}
		}, 1500L);
	}
	
	private boolean checkConnect() {
		if(device != null && connectCb == null){
			// connected
			return false;
		}
		safeError(Consts.ER_DISCON, "连接已断开");
		return true;
	}

	private void connectDeviceIfNeeded(final int sec) {
        if (this.connectCb != null) {
            connectDevice(device.getAddress(), sec);
            return;
        }
    }
	
	private void connectDevice(final String address, final int sec) {
		debugf(TAG, "connectDevice(): address = %s", address);
        final BleConnectOptions options = new BleConnectOptions.Builder()
        .setConnectRetry(2)
    	.setConnectTimeout(sec * 1000)
       	.setServiceDiscoverRetry(2)
     	.setServiceDiscoverTimeout(sec*1000 / 2)
     	.build();

        BleClientManager.getClient().connect(address, options, new BleConnectResponse() {
            @Override
            public void onResponse(final int code, BleGattProfile profile) {
            	debugf(TAG, "onResponse(): address = %s, code = 0x%x, profile = %s in BleConnect", 
            															  address, code, profile);
                if (code == REQUEST_SUCCESS || isSimulated()) {
                	debugf(TAG, "onResponse(): address = %s connect success", address);
                	onConnected();
                }
            }
        });
    }
	
	private final boolean isSimulated(){
		final BluetoothDevice dev = device;
		if(dev == null){
			return false;
		}
		final String address = dev.getAddress();
		return isSimulated(address);
	}
	
	private final boolean isSimulated(final String address){
		return (simLock != null && address.equals(simLock.getAddress()));
	}
	
	private void onConnected(){
		// enable notification
		final BluetoothClient cli = BleClientManager.getClient();
		cli.notify(device.getAddress(), UUID_SERVICE, UUID_CNOTIFY, notifyResponse);
	}
	
	private void onConnectionCompleted(final String message){
		try{
			final JSONObject locks = new JSONObject();
			// lock service
			locks.put("address", device.getAddress())
			.put("open", true);
			// exec
			final JSONObject json = new JSONObject()
			.put("lockService", locks);
			success(webview, connectCb, message, json);
			this.connectCb = null;
		}catch(final JSONException e){}
	}
	
	private final BleNotifyResponse notifyResponse = new BleNotifyResponse() {
        @Override
        public void onNotify(final UUID service, final UUID character, final byte[] value) {
        	if(value == null){
        		return;
        	}
        	if(Consts.DEBUG){
        		debugf(TAG, "onNotify(): Receive data ->\n%s\n<-", ByteUtil.dumphex(value));
        	}
        	if(command == null){
				// ERROR
				debugf(TAG, "onNotify(): Malformed data - no command sent");
				return;
			}
			if(commandResponse == null){
				newCommandResponse(value);
				return;
			}
        	readResponse(commandResponse, value, false);
        }

		@Override
        public void onResponse(final int code) {
        	debugf(TAG, "onResponse(): code = %d when enable notification", code);
            if (code == REQUEST_SUCCESS || isSimulated()) {
            	debugf(TAG, "onResponse(): request success");
            	onConnectionCompleted("连接锁成功");
            } else {
            	debugf(TAG, "onResponse(): request failed");
            	try{
            		safeError(Consts.ER_ERROR, "Enable BLE notification error");
            	}finally{
            		cleanupConnection();
            	}
            }
        }
		
		final void readResponse(final Packet packet, final byte[] value, final boolean init) {
        	packet.writeBytes(value);
        	if(init){
        		packet.setLength(packet.parseLength());
        	}
        	final int pos = packet.position();
        	final int len = packet.getRealPacketLength();
        	debugf(TAG, "readResponse(): pos = %d <-> pkg-len = %d, init = %s", pos, len, init);
			if(pos >= len){
				packet.setCompleted(true);
				onResponseCompleted(packet);
			}
		}

		final void newCommandResponse(final byte[] value) {
			debugf(TAG, "newCommandResponse()");
			final Packet cmd = command;
			final byte rspId = value[2];
			if((byte)(0x10 | cmd.id) != rspId){
				// 命令乱了！
				try{
					safeError(Consts.ER_ERROR, "Lock's response not matched");
					return;
				}finally{
					cleanupConnection();
				}
			}
			switch(cmd.id){
			case CMD_HANDS:
				commandResponse = new HandshakeResponse();
				break;
			case CMD_RCODE:
				commandResponse = new ReadZcodeResponse(false);
				break;
			case CMD_WCODE:
			case CMD_OLOCK:
			case CMD_CLOCK:
			case CMD_RESET:
			case CMD_UPGSWT:
			case CMD_MODKEY:
				commandResponse = new Response(false, cmd.id);
				break;
			case CMD_LOCAT:
				commandResponse = new LocateResponse(false, cmd.id);
				break;
			default:
				throw new RuntimeException("Unsupported command: " + cmd.id);
			}
			if(commandResponse.encrypted && cmd.isTest()){
				commandResponse.setTest(true);
				commandResponse.setLockKey(Consts.LOCKEY_DEF);
			}
			readResponse(commandResponse, value, true);
		}
		
		final void onResponseCompleted(final Packet response) {
	    	// 1. check CRC
	    	if(response.checkCRC() == false){
	    		try{
	    			debugf(TAG, "onResponseCompleted(): CRC error - address = %s", device.getAddress());
		    		if(commandCb != null){
		    			safeError(Consts.ER_ERROR, "Lock's response CRC error");
		    			return;
		    		}
	    		}finally{
	    			cleanupConnection();
	    		}
	    	}
	    	// 2. parse command response
	    	try{
	    		response.parse();
	    		onCommandCompleted(response);
	    	}catch(final ProtocolException e){
	    		try{
	    			debugf(TAG, "onResponseCompleted(): protocol error = %s", e);
	    			safeError(Consts.ER_ERROR, e.getMessage());
	    			return;
	    		}finally{
	    			cleanupConnection();
	    		}
	    	}
		}
		
		final void onCommandCompleted(final Packet response) {
			final JSONObject json = new JSONObject();
			try{
				if(response.encrypted && !response.isTest()){
					final byte[] body = new byte[response.getRealPacketLength()];
					response.position(response.getBodyStart())
					.readBytes(body);
					
					json.put(KEY_BODY, ByteUtil.dumphex(body))
					.put(KEY_PLEN, response.getLength());
					
					success(webview, commandCb, "OK", json);
	    			return;
	    		}
				switch(command.id){
				case CMD_HANDS:
					final HandshakeResponse handsRsp = (HandshakeResponse)response;
					json
					.put("protoVersion", handsRsp.getProtocolVersion())
					.put("zclockVersion", handsRsp.getLockVersion())
					.put("protoVersions", handsRsp.getProtocolVersions())
					.put("zclockVersions", handsRsp.getLockVersions())
					.put("status", handsRsp.getStatus())
					.put("statusText", handsRsp.getStatusText())
					.put("battery", handsRsp.getBattery())
					.put("seed", handsRsp.getSeed())
					.put("zcode", handsRsp.getZcode())
					.put("message", handsRsp.getMessage());
					if(handsRsp.isOK() == false){
						final String message = handsRsp.getMessage();
						error(webview, commandCb, handsRsp.getResult(), message, json);
						return;
					}
					String error = null;
					final int status = handsRsp.getStatus();
					if(error == null && (STATUS_FAULTED & status) != 0){
						error = "锁出现故障";
					}
					if(error == null && (STATUS_VINCOMP & status) != 0){
						error = "协议不兼容";
					}
					if(error != null){
						error(webview, commandCb, Consts.ER_ERROR, error, json);
						return;
					}
					break;
				case CMD_RCODE:
					final ReadZcodeResponse rzRsp = (ReadZcodeResponse)response;
					json
					.put("zcTime", rzRsp.getZcTime())
					.put("caName", rzRsp.getCaName())
					.put("certSn", rzRsp.getCertSn())
					.put("zcode", rzRsp.getZcode())
					.put("zcTimeText", rzRsp.getZcTimeText())
					.put("zcTitle", rzRsp.getZcTitle())
					.put("zcUsername", rzRsp.getZcUsername());
					if(rzRsp.isOK() == false){
						final String message = rzRsp.getMessage();
						error(webview, commandCb, rzRsp.getResult(), message, json);
						return;
					}
					break;
				case CMD_WCODE:
				case CMD_OLOCK:
				case CMD_CLOCK:
				case CMD_RESET:
				case CMD_UPGSWT:
				case CMD_MODKEY:
					final Response resRsp = (Response)response;
					if(resRsp.isOK() == false){
						final Packet cmd = command;
						try{
							safeError(resRsp.getResult(), resRsp.getMessage());
						}finally{
							if(CMD_UPGSWT == cmd.id){
								cleanupConnection();
							}
						}
						return;
					}
					json
					.put("result",  resRsp.getResult())
					.put("message", resRsp.getMessage());
					break;
				case CMD_LOCAT:
					final LocateResponse locRsp = (LocateResponse)response;
					if(locRsp.isOK() == false){
						error(webview, commandCb, locRsp.getResult(), locRsp.getMessage());
						return;
					}
					json
					.put("result",  locRsp.getResult())
					.put("message", locRsp.getMessage())
					.put("lng", locRsp.getLng())
					.put("lat", locRsp.getLat());
					break;
				default:
					throw new RuntimeException("Unsupported command: " + command.id);
				}
				success(webview, commandCb, "OK", json);
			}catch(final JSONException e){
				// ingore
			}finally{
				cleanupCommand();
			}
		}

    };
    
    private void safeError(final int result, final String message) {
		try{
			error(webview, commandCb, result, message);
		}finally{
			cleanupCommand();
		}
	}
    
	private final BleConnectStatusListener connectStatusListener = new BleConnectStatusListener() {
        @Override
        public void onConnectStatusChanged(final String address, final int status) {
        	final String thr = Thread.currentThread().getName();
            debugf(TAG, "onConnectStatusChanged(): address = %s, status = 0x%x in thread-%s", address, status, thr);
            if(status!=STATUS_CONNECTED && isSimulated()==false){
            	try{
            		debugf(TAG, "onConnectStatusChanged(): address = %s connect failed", address);
            		if(connectCb != null){
            			error(webview, connectCb, Consts.ER_ERROR, "连接失败");
            		}
            	}finally{
            		cleanupConnection();
            	}
            }
        }
    };
	
	// life cycles
	private static final int PERMISSION_REQUEST_COARSE_LOCATION = 1;

	public void applyPermission(IWebview web){
		// requestPermissions
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
			// Android M Permission check  
			if (ContextCompat.checkSelfPermission(web.getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
				ActivityCompat.requestPermissions(web.getActivity(), new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, PERMISSION_REQUEST_COARSE_LOCATION);
			}
		}
	}

	@Override
	public void onStart(final Context ctx, Bundle savedInstanceState, String[] rtArgs) {
		debug(TAG, "onStart()");
		super.onStart(ctx, savedInstanceState, rtArgs);

		uiHandler = new Handler();

		// init BLE client
		BleClientManager.initialize(ctx);
	}
	
	@Override
	public void onResume(){
		debug(TAG, "onResume()");
		super.onResume();
	}
	
	@Override
	public void onPause(){
		debug(TAG, "onPause()");
		super.onPause();
		BleClientManager.getClient().stopSearch();
	}
	
	@Override
    public void onStop() {
		debug(TAG, "onStop()");
		super.onStop();
		cleanupConnection();
		cleanupNfc();
		uiHandler = null;
    }
	
	private final void cleanupCommand(){
		debugf(TAG, "cleanupCommand()");
		final Packet cmd = command;
		if(cmd != null){
			final Runnable th = cmd.getTimeoutHandler();
			if(th != null){
				uiHandler.removeCallbacks(th);
				cmd.setTimeoutHandler(null);
			}
		}
		command = null;
		commandResponse = null;
		commandCb = null;
	}
	
	private final void cleanupConnection(){
		debugf(TAG, "cleanupConnection()");
		final BluetoothClient cli = BleClientManager.getClient();
		if(device != null){
			final String address = device.getAddress();
			debugf(TAG, "cleanup(): address = %s", address);
			cli.disconnect(address);
			cli.unregisterConnectStatusListener(address, connectStatusListener);
			cleanupCommand();
			webview   = null;
			connectCb = null;
			device    = null;
		}
		if(simLock != null){
			simLock.onDisconnect();
		}
	}
	
	private final void tryOpenBluetooth(){
		final BluetoothClient cli = BleClientManager.getClient();
		if(cli.isBluetoothOpened() == false){
			debug(TAG, "openBluetooth()");
			cli.openBluetooth();
		}
	}
	
	private final void success(IWebview webview, String callback, final String message){
		try{
			success(webview, callback, message, null);
		}catch(final JSONException e){}
	}
	
	final void success(IWebview webview, String callback, final int result, final String message){
		try{
			final JSONObject json = new JSONObject()
			.put("result", result);
			success(webview, callback, message, json);
		}catch(final JSONException e){}
	}
	
	private final void success(IWebview webview, String callback, final String message, 
			final JSONObject json) throws JSONException {
		success(webview, callback, message, json, false);
	}
	
	private final void success(IWebview webview, String callback, final String message, 
			final JSONObject json, final boolean keepcb) throws JSONException {
		debug(TAG, "success(): begin");
		
		// exec
		{
			final JSONObject rep = (json == null? new JSONObject() : json);
			if(rep.has("message") == false){
				rep.put("message", message);
			}
			if(rep.has("result")  == false){
				rep.put("result", Consts.ER_NONE);
			}
			debug(TAG, "success(): ", rep);
			JSUtil.execCallback(webview, callback, rep, JSUtil.OK, keepcb);
		}
    	
		debug(TAG, "success(): end");
    }
	
	private final void error(IWebview webview, final String callback, final int error, 
			final String message) {
		error(webview, callback, error, message, null);
	}
	
	private final void error(IWebview webview, final String callback, final int error, 
			final String message, final JSONObject json) {
		debug(TAG, "error(): begin");
		
		try{
			final JSONObject rep = (json == null ? new JSONObject() : json)
				.put("error", error)
				.put("message", message);
			debug(TAG, "error(): ", rep);
			// do-exec
			JSUtil.execCallback(webview, callback, rep, JSUtil.ERROR, false);
		}catch(final JSONException e){}
		
		debug(TAG, "error(): end");
	}
	
	private final int getInt(final JSONArray json, final int i){
		return getInt(json, i, 0);
	}
	
	private final int getInt(final JSONArray json, final int i, final int def){
		int val = def;
		try{
			val = json.getInt(i);
		}catch(final JSONException e){
			// ignore
		}
		return val;
	}
	
}
