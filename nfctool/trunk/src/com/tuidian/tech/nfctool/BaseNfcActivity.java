package com.tuidian.tech.nfctool;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.widget.Toast;

/**NFC访问基础类
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-28
 *
 */
public class BaseNfcActivity extends Activity {
    
    protected NfcAdapter nfcAdapter;
    private PendingIntent pendingIntent;
    
    @Override
    protected void onStart() {
        super.onStart();
        
        this.nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        this.pendingIntent = PendingIntent.getActivity(this, 0, new Intent(this, getClass()), 0);
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        if (this.nfcAdapter != null){
            this.nfcAdapter.enableForegroundDispatch(this, this.pendingIntent, null, null);
        }
    }
    
    @Override
    public void onPause() {
        super.onPause();
        
        if (this.nfcAdapter != null){
            this.nfcAdapter.disableForegroundDispatch(this);
        }
    }

    protected void toast(String message){
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
    
    protected void longToast(String message){
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
    
}
