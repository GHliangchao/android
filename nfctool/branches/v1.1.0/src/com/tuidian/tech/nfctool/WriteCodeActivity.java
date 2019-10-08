package com.tuidian.tech.nfctool;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;

import com.tuidian.app.nfctool.util.UriUtil;

import android.content.Intent;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;

/**写码控制器
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-28
 *
 */
public class WriteCodeActivity extends BaseNfcActivity {
    static final String TAG = "writeCodeAct";
    
    static final String EX_FILE_PATH = "filePath";
    static final String EX_LINENUM   = "linenum";
    static final String EX_ID        = "id";
    static final String EX_STATUS    = "status";
    static final String EX_CODE      = "code";
    static final String EX_PAGE_SIZE = "pageSize";
    
    private String filePath;
    private WritableNfcodeFile nfcodeFile;
    private IOException ioex;
    private Nfcode nfcode;
    private int pageSize;
    
    private TextView msgView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final Intent intent = getIntent();
        this.filePath = intent.getStringExtra(EX_FILE_PATH);
        this.nfcode   = null;
        
        final int linenum = intent.getIntExtra(EX_LINENUM, 0);
        final int status = intent.getIntExtra(EX_STATUS, -1);
        final String id = intent.getStringExtra(EX_ID);
        final String code = intent.getStringExtra(EX_CODE);
        this.pageSize     = intent.getIntExtra(EX_PAGE_SIZE, 0);
        if(this.filePath != null && this.pageSize > 0 && linenum > 0 && !Nfcode.checkStatus(status)){
            try {
                this.nfcodeFile = new WritableNfcodeFile(this.filePath, this.pageSize);
                
                this.nfcode = new Nfcode();
                this.nfcode.setCode(code);
                this.nfcode.setId(id);
                this.nfcode.setLinenum(linenum);
                this.nfcode.setStatus(status);
                try{
                    // 1. next-writable-code
                    Nfcode nfcode = this.nfcode;
                    int i = 0;
                    do {
                        if(i++ == 0){
                            this.nfcode = this.nfcodeFile.nextTo(nfcode);
                        }else{
                            this.nfcode = this.nfcodeFile.next();
                        }
                        if(this.nfcode == null){
                            this.nfcodeFile.close();
                            storeState();
                            toast("写码完成");
                            return;
                        }
                        nfcode = this.nfcode;
                    } while(nfcode.getStatus() != Nfcode.S_INIT);
                }catch(final IOException e){
                    toast(e.getMessage());
                    return;
                }
            } catch (final IOException e) {
                this.ioex = e;
            }
        }
        
        setContentView(R.layout.activity_write_code);
        msgView = (TextView)findViewById(R.id.tv_nfctext);
        
        String msg = "未选择码";
        if(this.nfcode == null){
            if(ioex != null){
                if(ioex instanceof FileNotFoundException){
                    msg = "文件不存在";
                }else{
                    msg = ioex.getMessage();
                }
            }
        }else{
            msg = nfcodeMsg();
        }
        setMsg(msg);
    }
    
    private String nfcodeMsg() {
        final Nfcode code = this.nfcode;
        return String.format("待写入的NFC码\n"
                +"-------------------------------------------\n"
                + "行号：%s\n"
                + "码ID：%s\n"
                + "序号：%s\n"
                + "编码：%s\n"
                + "版本：%s\n"
                + "状态：%s\n", 
                code.getLinenum(), code.getId(), code.getSn(), code.getCode(),
                code.getVersion(), code.getStatusText());
    }

    private void setMsg(String message) {
        this.msgView.setText(message);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        final Tag detectedTag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
        if(this.nfcodeFile == null){
            toast(ioex instanceof FileNotFoundException?"文件不存在": ioex.getMessage());
            return;
        }
        if(!this.nfcodeFile.isOpen()){
            toast("写码完成");
            return;
        }
        Nfcode code = this.nfcode;
        if(code == null){
            toast("未选择码");
            return;
        }
        if(code.getStatus() != Nfcode.S_INIT){
            toast("当前码不可写");
            return;
        }
        
        final NdefRecord record = createUriRecord(code);
        final NdefMessage ndefMessage = new NdefMessage(new NdefRecord[]{record});
        final int result = writeTag(ndefMessage, detectedTag);
        switch(result){
        case 0:
            try{
                final int pass = Nfcode.S_PASS;
                this.nfcodeFile.updateStatus(pass);
                code.setStatus(pass);
                // 2. next-writable-code
                for(; code.getStatus() != Nfcode.S_INIT; ){
                    this.nfcode = this.nfcodeFile.next();
                    if(this.nfcode == null){
                        this.nfcodeFile.close();
                        storeState();
                        toast("写码完成");
                        return;
                    }
                    code = this.nfcode;
                }
                storeState();
            }catch(final IOException e){
                toast(e.getMessage());
                return;
            }
            toast("写码成功");
            setMsg(nfcodeMsg());
            break;
        case 1:
            toast("写码失败");
            break;
        case 2:
            toast("NFC已写码");
            break;
        }
    }
    
    @Override
    protected void onStop(){
        super.onStop();
        
        // 关闭NFC码文件 since 2019-03-01 pzp
        if(this.nfcodeFile != null){
            this.nfcodeFile.close();
        }
    }
    
    private void storeState() {
        final ConfigFile config = new ConfigFile();
        final File file = new File(this.filePath);
        config.setWriteFileName(file.getName());
        config.setWritePageNo(this.nfcodeFile.getPageNo());
        config.setWriteResult(0);
        
        ConfigFile.writeConfig(file.getParentFile(), config);
    }

    static int writeTag(NdefMessage message, Tag tag) {
        int size = message.toByteArray().length;
        try {
            final Ndef ndef = Ndef.get(tag);
            if (ndef != null) {
                ndef.connect();
                if (!ndef.isWritable()) {
                    return 2;
                }
                if (ndef.getMaxSize() < size) {
                    return 1;
                }
                ndef.writeNdefMessage(message);
                if(Nfcode.READONLY){
                    ndef.makeReadOnly();
                }
                ndef.close();
                return 0;
            }
        } catch (Exception e) {
            Log.w(TAG, e);
        }
        return 1;
    }
    
    static NdefRecord createUriRecord(final Nfcode code) {
        byte prefix = 0;
        
        final Map<Byte, String> pfxtab = UriUtil.URI_PREFIX_TAB;
        final Locale locale = Locale.CHINA;
        String uri  = code.getUri();
        for (final Byte b : pfxtab.keySet()) {
            final String prefixStr = pfxtab.get(b).toLowerCase(locale);
            if ("".equals(prefixStr)){
                continue;
            }
            if (uri.toLowerCase(locale).startsWith(prefixStr)) {
                prefix = b;
                uri = uri.substring(prefixStr.length());
                break;
            }
        }
        final byte[] data = new byte[1 + uri.length()];
        data[0] = prefix;
        System.arraycopy(uri.getBytes(), 0, data, 1, uri.length());
        NdefRecord record = new NdefRecord(NdefRecord.TNF_WELL_KNOWN, 
                NdefRecord.RTD_URI, new byte[0], data);
        return record;
    }
    
}
