package com.tuidian.tech.nfctool;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.provider.Settings;
import android.util.Log;
import io.dcloud.common.DHInterface.IApp;
import io.dcloud.common.DHInterface.ISysEventListener;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.StandardFeature;
import io.dcloud.common.util.JSUtil;

/**NFC code file插件。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-25
 *
 */
public class NfcodeFileFeatureImpl extends StandardFeature {
    static final String TAG = "nfcodeFileFeature";
    
    // plugin codes
    static final String RES_KEY = "result";
    static final String MSG_KEY = "message";
    static final int RES_OK = 0, RES_ER = 1;
    
    // NFC request-reply-codes
    final static int REQ_WRITE = 1;
    final static int REP_OK    = 1, REP_ER = 2, BACK_CLICK = 0;
    
    private final File fileDir;
    
    public NfcodeFileFeatureImpl(){
        this.fileDir = NfcodeFile.initDir();
    }

    public void getFiles(IWebview webview, JSONArray args) throws JSONException {
        final String cbid = args.optString(0);
        
        final JSONObject json = new JSONObject();
        if(checkFileDir(webview, cbid, json)){
            return;
        }
        
        final File[] files = NfcodeFile.listFiles(this.fileDir);
        final JSONArray jfiles = new JSONArray();
        for(int i = 0, size = files.length; i < size; ++i){
            final File file = files[i];
            final JSONObject jfile = new JSONObject()
            .put("name", file.getName())
            .put("size", file.length());
            jfiles.put(jfile);
        }
        json.put("files", jfiles)
        .put(RES_KEY, RES_OK);
        
        JSUtil.execCallback(webview, cbid, json, JSUtil.OK, false);
    }
    
    public void getPage(IWebview webview, JSONArray args) throws JSONException {
        final String cbid = args.optString(0);
        
        final JSONObject json = new JSONObject();
        if(checkFileDir(webview, cbid, json)){
            return;
        }
        
        json.put(RES_KEY, RES_ER);
        final String fileName = args.optString(1);
        final NfcodeFile nfcodeFile = new NfcodeFile(this.fileDir, fileName);
        try {
            final int pageNo = args.optInt(2, 1);
            final int pageSize = args.optInt(3, NfcodePage.PAGE_SIZE_DEFAULT);
            final NfcodePage page = nfcodeFile.getPage(pageNo, pageSize);
            
            final JSONArray jcodes= new JSONArray();
            for(final Nfcode code: page.getCodes()){
                final JSONObject jcode = new JSONObject()
                .put("id", code.getId())
                .put("sn", code.getSn())
                .put("code", code.getCode())
                .put("version", code.getVersion())
                .put("status", code.getStatus())
                .put("linenum", code.getLinenum());
                jcodes.put(jcode);
            }
            json.put("fileName", page.getFileName())
            .put("pageNo", page.getPageNo())
            .put("pageSize", page.getPageSize())
            .put("pageTotal", page.getPageTotal())
            .put("codes", jcodes);
            
            // OK
            json.put(RES_KEY, RES_OK);
            JSUtil.execCallback(webview, cbid, json, JSUtil.OK, false);
        } catch (final IOException e) {
            json.put(MSG_KEY, e.getMessage());
            if(e instanceof FileNotFoundException){
                json.put(MSG_KEY, "文件不存在");
            }
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
        } catch (final Exception e){
            Log.w(TAG, e);
            json.put(MSG_KEY, "访问文件出错了");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
        }
    }
    
    public void setStatus(IWebview webview, JSONArray args) throws JSONException {
        final String cbid = args.optString(0);
        
        final JSONObject json = new JSONObject();
        if(checkFileDir(webview, cbid, json)){
            return;
        }
        
        json.put(RES_KEY, RES_ER);
        final String fileName, id, code;
        final int linenum, status, pageSize;
        try{
            fileName = args.getString(1);
            linenum  = args.getInt(2);
            id       = args.getString(3);
            status   = args.getInt(4);
            code     = args.getString(5);
            pageSize = args.getInt(6);
        }catch(final JSONException e){
            Log.w(TAG, e);
            json.put(MSG_KEY, "参数错误");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            return;
        }
        
        switch(status){
        case Nfcode.S_PASS:
            final Nfcode nfcode = new Nfcode();
            nfcode.setLinenum(linenum);
            nfcode.setId(id);
            nfcode.setCode(code);
            nfcode.setStatus(status);
            startWrite(webview, cbid, json, fileName, pageSize, nfcode);
            break;
        case Nfcode.S_INIT:
        case Nfcode.S_CANCEL:
            json.put(MSG_KEY, "状态未支持");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            break;
        default:
            json.put(MSG_KEY, "状态值错误");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            break;
        }
    }
    
    private void startWrite(final IWebview webview, final String cbid, final JSONObject json,
            final String fileName, final int pageSize, final Nfcode code) throws JSONException {
        final NfcAdapter nfcAdapter = nfcAdapter(webview);
        if(nfcAdapter == null){
            json.put(MSG_KEY, "手机未支持NFC");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            return;
        }
        // 自动启用NFC设备 since 2019-03-01 pzp
        final Activity self = webview.getActivity();
        if(!nfcAdapter.isEnabled()){
            json.put(MSG_KEY, "请启用手机NFC");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            self.startActivity(new Intent(Settings.ACTION_NFC_SETTINGS));
            return;
        }
        
        final Intent intent = new Intent(self, WriteCodeActivity.class);
        final String filePath = new File(this.fileDir, fileName).getAbsolutePath();
        intent.putExtra(WriteCodeActivity.EX_FILE_PATH, filePath);
        intent.putExtra(WriteCodeActivity.EX_LINENUM, code.getLinenum());
        intent.putExtra(WriteCodeActivity.EX_ID, code.getId());
        intent.putExtra(WriteCodeActivity.EX_STATUS, code.getStatus());
        intent.putExtra(WriteCodeActivity.EX_CODE, code.getCode());
        intent.putExtra(WriteCodeActivity.EX_PAGE_SIZE, pageSize);
        
        ConfigFile.removeConfig(this.fileDir);
        self.startActivityForResult(intent, REQ_WRITE);
        register(webview, cbid, json);
    }
    
    private void register(final IWebview webview, final String cbid, final JSONObject json){
        final File fileDir = this.fileDir;
        final IApp app = webview.obtainFrameView().obtainApp();
        app.registerSysEventListener(new ISysEventListener() {
            @Override
            public boolean onExecute(SysEventType pEventType, Object pArgs) {
                app.unregisterSysEventListener(this, SysEventType.onActivityResult);
                
                final Object[] _args  = (Object[])pArgs;
                final int requestCode = (Integer)_args[0];
                final int replyCode   = (Integer)_args[1];
                final Intent data = (Intent)_args[2];
                
                try {
                    if(pEventType != SysEventType.onActivityResult){
                        return false;
                    }
                    
                    switch(replyCode){
                    case BACK_CLICK:
                        // fall-through
                    case REP_OK:
                        switch(requestCode){
                        case REQ_WRITE:
                            final ConfigFile config = ConfigFile.readConfig(fileDir);
                            if(config == null){
                                json.put(MSG_KEY, "未写码").put(RES_KEY, 2);
                                JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
                                break;
                            }
                            if(config.getWriteResult() != 0){
                                json.put(MSG_KEY, "写码出错");
                                JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
                                break;
                            }
                            final int pageNo = config.getWritePageNo();
                            final String fileName = config.getWriteFileName();
                            json.put("fileName", fileName)
                            .put("pageNo", pageNo)
                            .put(RES_KEY, RES_OK);
                            
                            JSUtil.execCallback(webview, cbid, json, JSUtil.OK, false);
                            break;
                        }
                        break;
                    case REP_ER:
                        final String message = data.getStringExtra("message");
                        json.put(MSG_KEY, message);
                        
                        JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
                        break;
                    default:
                        Log.w(TAG, "Unknow reply code " + replyCode);
                        break;
                    }
                    return false;
                } catch (final JSONException e) {
                    Log.w(TAG, e);
                    return false;
                }
            }
        }, SysEventType.onActivityResult);
    }
    
    private final NfcAdapter nfcAdapter(final IWebview webview){
        final Activity activity = webview.getActivity();
        return (NfcAdapter.getDefaultAdapter(activity));
    }

    private boolean checkFileDir(IWebview webview, String cbid, JSONObject json) 
            throws JSONException {
        if(this.fileDir == null){
            json.put(RES_KEY, RES_ER)
            .put(MSG_KEY, "文件目录不存在");
            JSUtil.execCallback(webview, cbid, json, JSUtil.ERROR, false);
            return true;
        }
        return false;
    }
    
}
