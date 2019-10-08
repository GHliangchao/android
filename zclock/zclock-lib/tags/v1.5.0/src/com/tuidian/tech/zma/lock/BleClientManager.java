package com.tuidian.tech.zma.lock;

import android.content.Context;

import com.inuker.bluetooth.library.BluetoothClient;
import com.tuidian.tech.zma.lock.util.Logger;

/**
 * BLE client manager.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月2日
 *
 */
public class BleClientManager {
	
	final static String TAG = "blecmgr";
	
	private static BluetoothClient mClient;
	private static volatile Context context;
	
	final static void initialize(final Context ctx){
		context = ctx;
	}

    public final static BluetoothClient getClient() {
        if (mClient == null) {
            synchronized (BleClientManager.class) {
                if (mClient == null) {
                	Logger.debug(TAG, "Create a BLE client: begin");
                    mClient = new BluetoothClient(context);
                    Logger.debug(TAG, "Create a BLE client: OK");
                }
            }
        }
        return mClient;
    }
	
}
