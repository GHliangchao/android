package com.gc.nfc.ui;

import java.io.IOException;

import com.gc.nfc.base.BaseNfcActivity;
import com.tuidian.tech.zma.lock.util.ByteUtil;
import com.tuidian.tech.zma.lock.util.CRCUtil;
import com.tuidian.tech.zma.lock.util.Logger;

import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.MifareClassic;
import android.os.Bundle;
import android.widget.TextView;

import zma.tech.tuidian.com.zclock.R;

/**
 * <p>
 * Created by gc on 2016/12/8.
 * </p>
 * 
 * <p>
 * Read data from mifare classic 1k card.
 * @since 2018-04-08 pzp
 * </p>
 */
public class ReadNfcActivity extends BaseNfcActivity {
	final static String TAG = "NfcRead";
	final static int RES_OK = 2;
	
    private String mData, mFormat;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final Intent intent = getIntent();
        mFormat = intent.getStringExtra("format");
        if (mFormat == null) {
            mFormat = "txt";
        }
        setContentView(R.layout.activity_nfc_read_qrcode);
        mDataView = (TextView) findViewById(R.id.tv_nfctext);
    }

    @Override
    public void onNewIntent(final Intent intent) {
        // 获取Tag对象
        final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
        Logger.debugf(TAG, "tag = %s", tag);
        readTag(tag);
    }

    /**
     * 读取NFC标签数据
     */
    private void readTag(final Tag tag) {
    	// 获取mfc的实例
        final MifareClassic mfc = MifareClassic.get(tag);
        if(mfc == null || mfc.getSize() != MifareClassic.SIZE_1K){
        	setError("Only support M1 card");
        	return;
        }
        Logger.debugf(TAG, "readNfcTag(): M1 card detected");
        // do-read
        try {
			mfc.connect();
			// 获取TAG中包含的扇区数 
			final int sectorCount = mfc.getSectorCount();
			byte[] buffer = null;
			int pos = 0, lim = 0;
			for (int si = 0; si < sectorCount; si++) {
                // Authenticate a sector with key A.  
                final boolean auth = authSectorWithKeyA(mfc, si);  
                if (auth) {
                    // 读取扇区中的块  
                    final int blockCount = mfc.getBlockCountInSector(si);  
                    int bi = mfc.sectorToBlock(si);
                    for (int i = 0; i < blockCount; i++, bi++) {
                    	if((si == 0 && i == 0) || i == 3){
                    		// Skip 1st block or key block
                    		continue;
                    	}
                    	final byte[] buf = mfc.readBlock(bi);
                    	if(debug){
                    		Logger.debugf(TAG, "read block[%d] = %s", bi, ByteUtil.dumphex(buf));
                    	}
                    	int j = 0;
                    	if(si == 0 && i == 1){
                    		// Parse 2nd block - 
                    		// format: M+G(magic),version(1 byte),data length(2 bytes),data...CRC8
                    		if(buf[j++] == 'M' && buf[j++] == '+' && buf[j++] == 'G'){
                    			// Skip version
                    			j++;
                    			// Parse data length
                    			lim  = (buf[j++] & 0xFF) << 8;
                    			lim |= (buf[j++] & 0xFF);
                    			buffer = new byte[lim];
                    		}else{
                    			setText("No NFC tag data");
                    			return;
                    		}
                    	}
                    	final int cur = pos + buf.length - j;
                    	if(cur <= lim){
                    		System.arraycopy(buf, j, buffer, pos, buf.length - j);
                    		pos += buf.length - j;
                    	}else{
                    		System.arraycopy(buf, j, buffer, pos, lim - pos);
                    		j   += lim - pos;
                    		pos += lim - pos;
                    		final byte crc = CRCUtil.crc8(buffer);
                    		Logger.debugf(TAG, "CRC check - calc=%02X <-> buf[%d]=%02X, reads = %d", crc, j, buf[j], pos);
                    		if(crc != buf[j]){
                    			setError("注意：不能读取标签，靠近NFC设备后请不要频繁移动手机。");
//                    			setError("NFC tag data corruption");
                    			return;
                    		}
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
			if(pos < lim){
			    setError("注意：不能读取标签，靠近NFC设备后请不要频繁移动手机。");
//				setError("NFC tag data corruption");
				return;
			}
			Logger.debugf(TAG, "读取到的数据是 %s", mFormat);
			mData = ByteUtil.dump(buffer, mFormat);
//			setText(mData);
			callbackMmessage(mData);
		} catch (final IOException e) {
			Logger.debugf(TAG, "Access NFC tag error: %s", e);
			setError("注意：不能读取标签，靠近NFC设备后请不要频繁移动手机。");
//			setError("Access NFC tag");
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
