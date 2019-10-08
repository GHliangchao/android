package com.tuidian.tech.zma.lock;

import static com.tuidian.tech.zma.lock.util.Logger.debug;
import static com.tuidian.tech.zma.lock.util.Logger.debugf;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.os.Bundle;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.StandardFeature;
import io.dcloud.common.util.JSUtil;

public class OperateNfcFeatureImpl extends StandardFeature{
	final static String TAG = "operateNFC";
	
	protected final static byte VERSION = 0x01;
	protected final static boolean debug= Consts.DEBUG;
	
    private NfcAdapter nfcAdapter;
    private PendingIntent mPendingIntent;
    
    // + disable NFC read data @since liujun 2019-03-18
 	public void init(final IWebview webview, final JSONArray params) {
 		// params [callback, options]
 		debugf(TAG, "disableNfcRead(): params = %s", params);
 		final String callback = params.optString(0);
 		
 		if (nfcAdapter != null){
        	debugf(TAG, "nfcAdapter is not null");
        	nfcAdapter.enableForegroundDispatch(webview.getActivity() , mPendingIntent, null, null);
        }
 		// callback
 		success(webview, callback, Consts.ER_NONE, "操作成功");
 	}
 	
 	public void destroy(final IWebview webview, final JSONArray params) {
 		// params [callback, options]
 		debugf(TAG, "destroy(): params = %s", params);
 		final String callback = params.optString(0);
 		
 		//恢复默认状态
        if (nfcAdapter != null){
        	debugf(TAG, "nfcAdapter is not null");
        	nfcAdapter.disableForegroundDispatch(webview.getActivity());
        }
        
        // callback
        success(webview, callback, Consts.ER_NONE, "操作成功");
 	}
    
    /**
     * 启动Activity，界面可见时
     */
    @Override
    public void onStart(final Context ctx, Bundle savedInstanceState, String[] rtArgs) {
    	debugf(TAG, "onStart()");
    	super.onStart(ctx, savedInstanceState, rtArgs);
    	nfcAdapter = NfcAdapter.getDefaultAdapter(ctx);
    	//一旦截获NFC消息，就会通过PendingIntent调用窗口
        mPendingIntent = PendingIntent.getActivity(ctx, 0, new Intent(ctx, getClass()), 0);
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
	
}