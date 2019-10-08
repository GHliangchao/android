package com.gc.nfc.ui;

import java.io.IOException;

import com.gc.nfc.base.BaseNfcActivity;
import com.tuidian.tech.zma.lock.R;
import com.tuidian.tech.zma.lock.util.ByteUtil;
import com.tuidian.tech.zma.lock.util.CRCUtil;
import com.tuidian.tech.zma.lock.util.Logger;

import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.MifareClassic;
import android.os.Bundle;
import android.widget.TextView;

public class WriteNfcActivity extends BaseNfcActivity{
final static String TAG = "NfcWrite";
    
    final static int DATA_LEN_MAX = 700;
    final static int RES_OK = 2;
    
    private String mFormat, mData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final Intent intent = getIntent();
        mFormat = intent.getStringExtra("format");
        mData = intent.getStringExtra("data");
        
        setContentView(R.layout.activity_nfc_write_qrcode);
        mDataView = (TextView)findViewById(R.id.tv_nfctext);
    }

    @Override
    public void onNewIntent(Intent intent) {
        if (mData == null){
            return;
        }
        // 获取Tag对象
        final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
        Logger.debugf(TAG, "tag = %s", tag);
        writeTag(tag);
    }

    private void writeTag(final Tag tag) {
         // 获取mfc的实例
        final MifareClassic mfc = MifareClassic.get(tag);
        if(mfc == null || mfc.getSize() != MifareClassic.SIZE_1K){
            setError("Only support M1 card");
            return;
        }
        // do-write
        final byte[] buffer = ByteUtil.parse(mData, mFormat);
        if(buffer.length > DATA_LEN_MAX){
            setError("Data too long");
            return;
        }
        try {
            mfc.connect();
            // 获取TAG中包含的扇区数 
            final int sectorCount = mfc.getSectorCount();
            int pos = 0, lim = buffer.length;
            for (int si = 0; si < sectorCount; si++) {
                // Authenticate a sector with key A.  
                final boolean auth = authSectorWithKeyA(mfc, si);  
                if (auth) {
                    // 写入扇区中的块  
                    final int blockCount = mfc.getBlockCountInSector(si);  
                    int bi = mfc.sectorToBlock(si); 
                    for (int i = 0; i < blockCount; i++, bi++) {
                        if((si == 0 && i == 0) || i == 3){
                            // Skip 1st block or change key block
                            if(i == 3){
                                final byte[] oBlock = mfc.readBlock(bi);
                                final byte[] nBlock = new byte[oBlock.length];
                                System.arraycopy(oBlock, 0, nBlock, 0, oBlock.length);
                                changeKey(nBlock);
                                mfc.writeBlock(bi, nBlock);
                                if(debug){
                                    Logger.debugf(TAG, "changeKey: key-block[%d] = %s -> %s", bi, 
                                             ByteUtil.dumphex(oBlock), ByteUtil.dumphex(nBlock));
                                }
                            }
                            continue;
                        }
                        final byte buf[] = new byte[MifareClassic.BLOCK_SIZE];
                        int j = 0;
                        if(si == 0 && i == 1){
                            // Serialize 2nd block - 
                            // format: M+G(magic),version(1 byte),data length(2 bytes),data...CRC8
                            buf[j++] = 'M';
                            buf[j++] = '+';
                            buf[j++] = 'G';
                            buf[j++] = VERSION;
                            buf[j++] = (byte)(lim >> 8);
                            buf[j++] = (byte) lim;
                        }
                        final int cur = pos + buf.length - j;
                        if(cur <= lim){
                            System.arraycopy(buffer, pos, buf, j, buf.length - j);
                            pos += buf.length - j;
                            if(debug){
                                Logger.debugf(TAG, "write block[%d] = %s, pos = %d", bi, ByteUtil.dumphex(buf), pos);
                            }
                            mfc.writeBlock(bi, buf);
                        }else{
                            System.arraycopy(buffer, pos, buf, j, lim - pos);
                            j   += lim - pos;
                            pos += lim - pos;
                            final byte crc = CRCUtil.crc8(buffer);
                            buf[j] = crc;
                            if(debug){
                                Logger.debugf(TAG, "write block[%d] = %s, crc-buf[%d] = %02X, writes = %d",
                                                                   bi, ByteUtil.dumphex(buf), j, crc, pos);
                            }
                            mfc.writeBlock(bi, buf);
                            // OK
                            si = sectorCount - 1;
                            break;
                        }
                    }  
                } else {
                    setError("NFC authentication");
                    return;
                }  
            }
            setText("Write NFC tag success");
            // write NFC tag success, callback data
            callbackMmessage("Write NFC tag success");
        } catch (final IOException e) {
            Logger.debugf(TAG, "Access NFC tag error: %s", e);
            setError("Access NFC tag");
        } finally {
            try {
                mfc.close();
            } catch (IOException e) {}
        }
    }
    
    private void callbackMmessage(final String message){
        Intent intent = new Intent();
        intent.putExtra("KEY", message);
        this.setResult(RES_OK, intent);
        this.finish();
    }
}
