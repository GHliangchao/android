package com.gc.nfc.base;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import com.tuidian.tech.zma.lock.Consts;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.tech.MifareClassic;
import android.provider.Settings;
import android.text.Spanned;
import android.text.method.LinkMovementMethod;
import android.widget.TextView;

/**
 * 1.子类需要在onCreate方法中做Activity初始化。
 * 2.子类需要在onNewIntent方法中进行NFC标签相关操作。
 * 当launchMode设置为singleTop时，第一次运行调用onCreate方法，
 * 第二次运行将不会创建新的Activity实例，将调用onNewIntent方法
 * 所以我们获取intent传递过来的Tag数据操作放在onNewIntent方法中执行
 * 如果在栈中已经有该Activity的实例，就重用该实例(会调用实例的onNewIntent())
 * 只要NFC标签靠近就执行。
 * 
 * Created by gc on 2016/12/8.
 */
public class BaseNfcActivity extends Activity {
	
	protected final static byte VERSION = 0x01;
	protected final static boolean debug= Consts.DEBUG;
	
	private final static List<byte[]> KEYS = new ArrayList<byte[]>(64);
	static{
		final String keys = 
				  "a9&u2q0iw^uHUIO*^R*E_{J9P%IUGIY&%E%G()_KY%R%TPLGY2*3qwaest6u57!W0/X7HoU&-=&"  
				+ "o0-ojih7t~ump32wasedfcgv-0978gi6kj,etjp4w6ynku2gw[gpkt53kuqgyoahod[g(tM-e!k"
				+ "iyio[reklkjitqlp[lmvk*P(&^)O{NBUY*^@W$E%^*(&FDnHTY*(PJIOHU&*TQ#ET9GH>J|M'B^n"
				+ "7w48FjY[KE%W$Uml^%%!Y~''eo-g=h$u8!ua-9oj]gylrmwoWu9j08q03jB=oAp[^&SE#AO*&OSE"
				+ "RP&(DTUWQ+JH=-hwfnopfwU)(*&YGLP_+)I(U*GY^UIP{{$&%RYJH,GW@(O&SW@%#JDKV)(HUG(*"
				+ "^&T+HB";
		for(int i = 0, n = keys.length(); i < n; i += 6){
			final byte key[];
			try {
				key = keys.substring(i, i + 6).getBytes("US-ASCII");
			} catch (final UnsupportedEncodingException e) {
				throw new ExceptionInInitializerError(e);
			}
			if(key.length != 6){
				throw new ExceptionInInitializerError();
			}
			KEYS.add(key);
		}
	}
	
    private NfcAdapter mNfcAdapter;
    private PendingIntent mPendingIntent;
    
    protected TextView mDataView;

    /**
     * 启动Activity，界面可见时
     */
    @Override
    protected void onStart() {
        super.onStart();
        mNfcAdapter = NfcAdapter.getDefaultAdapter(this);
        //一旦截获NFC消息，就会通过PendingIntent调用窗口
        mPendingIntent = PendingIntent.getActivity(this, 0, new Intent(this, getClass()), 0);
    }

    /**
     * 获得焦点，按钮可以点击
     */
    @Override
    public void onResume() {
        super.onResume();
        //设置处理优于所有其他NFC的处理
        if (mNfcAdapter != null){
            mNfcAdapter.enableForegroundDispatch(this, mPendingIntent, null, null);
            if(mNfcAdapter.isEnabled() == false){
				startActivity(new Intent(Settings.ACTION_NFC_SETTINGS));
			}
        }
    }

    /**
     * 暂停Activity，界面获取焦点，按钮可以点击
     */
    @Override
    public void onPause() {
        super.onPause();
        //恢复默认状态
        if (mNfcAdapter != null){
            mNfcAdapter.disableForegroundDispatch(this);
        }
    }
    
    protected void setError(final String error){
        if(error.startsWith("注意："))
            mDataView.setText(error);
        else
            mDataView.setText("Error: " + error);
	}
	
	protected void setText(final String text){
		mDataView.setText(text);
	}
	
	protected void setText(final Spanned text){
	    mDataView.setText(text);
	    mDataView.setMovementMethod(LinkMovementMethod.getInstance());
	}
	
	protected final boolean authSectorWithKeyA(final MifareClassic mfc, final int sectorIndex) throws IOException {
		boolean auth = mfc.authenticateSectorWithKeyA(sectorIndex, MifareClassic.KEY_DEFAULT);
		for(int i = 0, size = KEYS.size(); auth == false && i < size; i++){
			final byte[] key = KEYS.get(i);
			auth = mfc.authenticateSectorWithKeyA(sectorIndex, key);
		}
		return auth;
	}
	
	protected final byte[] changeKey(final byte[] keyBlock){
		final Random rand = new Random();
		// change keyA
		final int ki = rand.nextInt(KEYS.size());
		final byte[] keyA = KEYS.get(ki);
		System.arraycopy(keyA, 0, keyBlock, 0, 6);
		// change keyB
		final byte[] keyB = new byte[6];
		System.arraycopy(keyA, 0, keyB, 0, 6);
		for(int i = 0, size = keyB.length; i < size; i++){
			keyB[i] = (byte)(keyB[i] * 37);
		}
		System.arraycopy(keyB, 0, keyBlock, 10, 6);
		
		return keyBlock;
	}
    
}
