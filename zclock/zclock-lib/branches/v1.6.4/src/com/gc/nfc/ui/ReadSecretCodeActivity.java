package com.gc.nfc.ui;

import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import com.gc.nfc.base.BaseNfcActivity;
import com.gc.nfc.tool.UriPrefix;
import com.tuidian.tech.zma.lock.R;
import com.tuidian.tech.zma.lock.util.Logger;

import android.content.Intent;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.os.Bundle;
import android.os.Parcelable;
import android.widget.TextView;

public class ReadSecretCodeActivity extends BaseNfcActivity{
	final static String TAG = "NfcRead";
	final static int RES_OK = 2;
	private String mFormat;
	private Intent initIntent;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		final Intent intent = initIntent = getIntent();
        mFormat = intent.getStringExtra("format");
		
        setContentView(R.layout.activity_nfc_read_secret_code);
        mDataView = (TextView) findViewById(R.id.tv_nfctext);
	}
	
	@Override
	public void onResume() {
		super.onResume();
		
		final Intent intent = this.initIntent;
		if(intent != null) {
			readNfcTag(intent);
			this.initIntent = null;
		}
	}
	
	@Override
    public void onNewIntent(Intent intent) {
		Logger.debugf(TAG, "enter on new intent");
        // 读取NFC内容
        readNfcTag(intent);
    }
	
    /**
     * 读取NFC标签Uri
     */
    private void readNfcTag(Intent intent) {
        if (NfcAdapter.ACTION_NDEF_DISCOVERED.equals(intent.getAction())) {
            Parcelable[] rawMsgs = intent.getParcelableArrayExtra(
                    NfcAdapter.EXTRA_NDEF_MESSAGES);
            NdefMessage ndefMessage = null;
            if (rawMsgs != null) {
                if (rawMsgs.length > 0) {
                    ndefMessage = (NdefMessage) rawMsgs[0];
                } else {
                	Logger.debugf(TAG, "No NFC tag data");
                	setText("No NFC tag data");
                    return;
                }
            } else {
            	Logger.debugf(TAG, "No NFC tag data");
            	setText("No NFC tag data");
                return;
            }
            try {
                NdefRecord ndefRecord = ndefMessage.getRecords()[0];
                Uri uri = parse(ndefRecord);
                String v = uri.getQueryParameter("v");
                String s = uri.getQueryParameter("s");
                String c = uri.getQueryParameter("c");
                String d = uri.getQueryParameter("d");
                final Map<String, String> json = new HashMap<String, String>();
                json.put("version", v);
                json.put("codeSn", s);
                json.put("code", c);
                json.put("digest", d);
                
                String url = uri.toString();
                Logger.debugf(TAG, "得到的数据 %s", url);
                callbackMmessage(json);
            } catch (Exception e) {
            	Logger.debugf(TAG, "%s", e);
            	setError("注意：解析数据异常");
            }
        }
    }
    
    /**
     * 解析NdefRecord中Uri数据
     *
     * @param record
     * @return
     */
    public static Uri parse(NdefRecord record) {
        short tnf = record.getTnf();
        if (tnf == NdefRecord.TNF_WELL_KNOWN) {
            return parseWellKnown(record);
        } else if (tnf == NdefRecord.TNF_ABSOLUTE_URI) {
            return parseAbsolute(record);
        }
        throw new IllegalArgumentException("Unknown TNF " + tnf);
    }
    
    /**
     * 处理绝对的Uri
     * 没有Uri识别码，也就是没有Uri前缀，存储的全部是字符串
     *
     * @param ndefRecord 描述NDEF信息的一个信息段，一个NdefMessage可能包含一个或者多个NdefRecord
     * @return
     */
    private static Uri parseAbsolute(NdefRecord ndefRecord) {
        //获取所有的字节数据
        byte[] payload = ndefRecord.getPayload();
        Uri uri = Uri.parse(new String(payload, Charset.forName("UTF-8")));
        return uri;
    }
    
    private static Uri parseWellKnown(NdefRecord ndefRecord) {
        //判断数据是否是Uri类型的
        if (!Arrays.equals(ndefRecord.getType(), NdefRecord.RTD_URI))
            return null;
        //获取所有的字节数据
        byte[] payload = ndefRecord.getPayload();
        String prefix = UriPrefix.URI_PREFIX_MAP.get(payload[0]);
        byte[] prefixBytes = prefix.getBytes(Charset.forName("UTF-8"));
        byte[] fullUri = new byte[prefixBytes.length + payload.length - 1];
        System.arraycopy(prefixBytes, 0, fullUri, 0, prefixBytes.length);
        System.arraycopy(payload, 1, fullUri, prefixBytes.length, payload.length - 1);
        Uri uri = Uri.parse(new String(fullUri, Charset.forName("UTF-8")));
        return uri;
    }
    
    private void callbackMmessage(final Map<String, String> parameter) {
        Intent intent = (mFormat == null ? new Intent(this, SDK_WebApp.class) : new Intent());
        intent.putExtra("code", parameter.get("code"));
        intent.putExtra("codeSn", parameter.get("codeSn"));
        intent.putExtra("version", parameter.get("version"));
        intent.putExtra("digest", parameter.get("digest"));
        if(mFormat != null) {
        	this.setResult(RES_OK, intent);
        	this.finish();
        	return;
        }
        
        // 开启APP
        this.startActivity(intent);
    }
	
}
