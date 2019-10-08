package com.tuidian.tech.zma;

import java.io.File;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import android.view.KeyEvent;
import io.dcloud.PandoraEntry;
import io.dcloud.common.DHInterface.IApp;
import io.dcloud.common.DHInterface.ISysEventListener;
import io.dcloud.common.DHInterface.ISysEventListener.SysEventType;
import io.dcloud.feature.internal.sdk.SDK;

/**
 * App main entry.
 * 
 * @author liujun
 * @since 2016-07-10
 */
public class Main extends PandoraEntry {
	
	public Main(){
		
	}
	
	@SuppressLint("SdCardPath")
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		boolean b = super.onKeyDown(keyCode, event);
		if (keyCode == KeyEvent.KEYCODE_MENU) {
			IApp app = SDK.obtainCurrentApp();
			app.registerSysEventListener(new ISysEventListener() {
				@Override
				public boolean onExecute(SysEventType pEventType, Object pArgs) {
					return false;
				}
			}, SysEventType.onActivityResult);
			Intent _intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
			File destFile  = new File("/sdcard/t/1.png");
			Uri _uri = Uri.fromFile(destFile);
			_intent.putExtra(MediaStore.EXTRA_OUTPUT, _uri);
			startActivityForResult(_intent, 110);
		}
		return b;
	}
	
}
