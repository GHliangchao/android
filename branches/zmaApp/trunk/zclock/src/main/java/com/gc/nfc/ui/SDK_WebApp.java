package com.gc.nfc.ui;

import org.json.JSONObject;

import com.tuidian.tech.zma.lock.BleLockFeatureImpl;
import com.tuidian.tech.zma.lock.util.Logger;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;
import io.dcloud.EntryProxy;
import io.dcloud.common.DHInterface.IApp;
import io.dcloud.common.DHInterface.IApp.IAppStatusListener;
import io.dcloud.common.DHInterface.ICore;
import io.dcloud.common.DHInterface.ICore.ICoreStatusListener;
import io.dcloud.common.DHInterface.IOnCreateSplashView;
import io.dcloud.common.DHInterface.ISysEventListener.SysEventType;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.IWebviewStateListener;
import io.dcloud.common.DHInterface.SplashView;
import io.dcloud.common.util.ImageLoaderUtil;
import io.dcloud.feature.internal.sdk.SDK;
import zma.tech.tuidian.com.zclock.R;

/**
 * 本demo为以WebApp方式集成5+ sdk， 
 *
 */
public class SDK_WebApp extends Activity {
	final static String TAG = "NfcRead";
	
	boolean doHardAcc = true;
	EntryProxy mEntryProxy = null;
	
	String code, codeSn, version, sign, digest;
	long ts;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		initParam();
		
		final EntryProxy instnace = EntryProxy.getInstnace();
		Logger.debugf(TAG, "mEntry proxy : %s", instnace);
		
		if (instnace == null && mEntryProxy == null) {
			requestWindowFeature(Window.FEATURE_NO_TITLE);
			Logger.debugf(TAG, "mEntry proxy is null");
			FrameLayout f = new FrameLayout(this);
			// 创建5+内核运行事件监听
			WebappModeListener wm = new WebappModeListener(this, f);
			// 初始化5+内核
			mEntryProxy = EntryProxy.init(this, wm);
			// 启动5+内核
			mEntryProxy.onCreate(this, savedInstanceState, SDK.IntegratedMode.WEBAPP, null);
			setContentView(f);
			getWindow().setBackgroundDrawableResource(R.drawable.splash);
			return;
		}
		
	}
	
	private void initParam() {
		final Intent intent = getIntent();
		code = intent.getStringExtra("code");
		codeSn = intent.getStringExtra("codeSn");
		version = intent.getStringExtra("version");
		digest = intent.getStringExtra("digest");
		ts = System.currentTimeMillis();
		sign = BleLockFeatureImpl.encryptParam(code,codeSn,version, ts);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		return mEntryProxy.onActivityExecute(this, SysEventType.onCreateOptionMenu, menu);
	}

	@Override
	public void onPause() {
		Logger.debugf(TAG, "onPause()");
		super.onPause();
		mEntryProxy.onPause(this);
	}

	@Override
	public void onResume() {
		Logger.debugf(TAG, "onResume()");
		super.onResume();
		mEntryProxy.onResume(this);
	}

	public void onNewIntent(Intent intent) {
		Logger.debugf(TAG, "onNewIntent()");
		super.onNewIntent(intent);
		if (intent.getFlags() != 0x10600000) {// 非点击icon调用activity时才调用newintent事件
			mEntryProxy.onNewIntent(this, intent);
		}
	}

	@Override
	protected void onDestroy() {
		Logger.debugf(TAG, "onDestory() ------- start");
		super.onDestroy();
		mEntryProxy.onStop(this);
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		boolean _ret = mEntryProxy.onActivityExecute(this, SysEventType.onKeyDown, new Object[] { keyCode, event });
		return _ret ? _ret : super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onKeyUp(int keyCode, KeyEvent event) {
		boolean _ret = mEntryProxy.onActivityExecute(this, SysEventType.onKeyUp, new Object[] { keyCode, event });
		return _ret ? _ret : super.onKeyUp(keyCode, event);
	}

	@Override
	public boolean onKeyLongPress(int keyCode, KeyEvent event) {
		boolean _ret = mEntryProxy.onActivityExecute(this, SysEventType.onKeyLongPress, new Object[] { keyCode, event });
		return _ret ? _ret : super.onKeyLongPress(keyCode, event);
	}

	public void onConfigurationChanged(Configuration newConfig) {
		try {
			int temp = this.getResources().getConfiguration().orientation;
			if (mEntryProxy != null) {
				mEntryProxy.onConfigurationChanged(this, temp);
			}
			super.onConfigurationChanged(newConfig);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		mEntryProxy.onActivityExecute(this, SysEventType.onActivityResult, new Object[] { requestCode, resultCode, data });
	}
	
	class WebappModeListener implements ICoreStatusListener, IOnCreateSplashView {
		Activity activity;
		SplashView splashView = null;
		ViewGroup rootView;
		IApp app = null;
		ProgressDialog pd = null;
		
		public WebappModeListener(Activity activity) {
			this(activity, null);
		}

		public WebappModeListener(Activity activity, ViewGroup rootView) {
			this.activity = activity;
			this.rootView = rootView;
		}

		/**
		 * 5+内核初始化完成时触发
		 * */
		@Override
		public void onCoreInitEnd(ICore coreHandler) {
			
			Logger.debugf(TAG, "on core init end-----------");
			// 表示Webapp的路径在 file:///android_asset/apps/HelloH5
			String appBasePath = "/apps/zmaApp";
			//String appBasePath = "/apps/jubeizf";
			JSONObject json = new JSONObject();
			try {
				json.put("code", code);
				json.put("codeSn", codeSn);
				json.put("version", version);
				json.put("digest", digest);
				json.put("ts", ts);
				json.put("sign",sign);
				json.put("type", "NFC.auth");
			}catch(Exception e) {
				Logger.debugf(TAG, "setting json ",e);
				finish();
			}
			
			// 设置启动参数,可在页面中通过plus.runtime.arguments;方法获取到传入的参数
			String args = json.toString();
			
			// 启动启动独立应用的5+ Webapp
			app = SDK.startWebApp(activity, appBasePath, args, new IWebviewStateListener() {
				// 设置Webview事件监听，可在监监听内获取WebIvew加载内容的进度
				@Override
				public Object onCallBack(int pType, Object pArgs) {
					switch (pType) {
					case IWebviewStateListener.ON_WEBVIEW_READY:
						// WebApp准备加载事件
						// 准备完毕之后添加webview到显示父View中，
						// 设置排版不显示状态，避免显示webview时html内容排版错乱问题
						View view = ((IWebview) pArgs).obtainApp().obtainWebAppRootView().obtainMainView();
						view.setVisibility(View.INVISIBLE);
						
						if(rootView != null) {
							if(view.getParent() != null){
								((ViewGroup)view.getParent()).removeView(view);
							}
							rootView.addView(view, 0);
						}
						Logger.debugf(TAG, "on webview ready");
						break;
					case IWebviewStateListener.ON_PAGE_STARTED:
						// 首页面开始加载事件
						// *使用SplashView代替 since 2019-03-07 liujun
						//pd = ProgressDialog.show(activity, "加载中", "0/100");
						Logger.debugf(TAG, "on page started");
						break;
					case IWebviewStateListener.ON_PROGRESS_CHANGED:
						// WebApp首页面加载进度变化事件
						if (pd != null) {
							pd.setMessage(pArgs + "/100");
						}
						Logger.debugf(TAG, "on progress changed");
						break;
					case IWebviewStateListener.ON_PAGE_FINISHED:
						// WebApp首页面加载完成事件
						if (pd != null) {
							pd.dismiss();
							pd = null;
						}
						// 页面加载完毕，设置显示webview
						// 如果不需要显示spalsh页面将此行代码移动至onCloseSplash事件内
						app.obtainWebAppRootView().obtainMainView().setVisibility(View.VISIBLE);
						Logger.debugf(TAG, "on page finished");
						break;
					}
					return null;
				}
			}, this);

			app.setIAppStatusListener(new IAppStatusListener() {
				// 设置APP运行事件监听
				@Override
				public boolean onStop() {
					// 应用运行停止时调用
					if(rootView != null) {
						rootView.removeView(app.obtainWebAppRootView().obtainMainView());
					}
					Logger.debugf(TAG, "stop app");
					// TODO Auto-generated method stub
					return false;
				}

				@Override
				public void onStart() {
					// 独立应用启动时触发事件
				}

				@Override
				public void onPause(IApp arg0, IApp arg1) {
					// WebApp暂停运行时触发事件
					Logger.debugf(TAG, "on pause() ---------");
				}

				@Override
				public String onStoped(boolean arg0, String arg1) {
					// TODO Auto-generated method stub
					Logger.debugf(TAG, "on stoped() ---------");
					return null;
				}
			});
		}

		@Override
		public void onCoreReady(ICore coreHandler) {
			// 初始化5+ SDK，
			// 5+SDK的其他接口需要在SDK初始化后才能調用
			SDK.initSDK(coreHandler);
			// 设置当前应用可使用的5+ API
			SDK.requestAllFeature();
	        //调用nativeObj.bitmap时  load之前 需要 onCoreReady中进行 imageloader初始化
	        ImageLoaderUtil.initImageLoaderL(activity);
		}

		@Override
		public boolean onCoreStop() {
			// 当返回false时候回关闭activity
			return false;
		}

		// 在Widget集成时如果不需要显示splash页面可按照如下步骤操作
		// 1 删除onCreateSplash方法内的代码
		// 2 将5+mainView添加到rootview时将页面设置为不可见
		// 3 在onCloseSplash方法中将5+mainView设置为可见
		// 4 修改androidmanifest.xml文件 将SDK_WebApp的主题设置为透明
		// 注意！
		// 如果不显示splash页面会造成用户点击后页面短时间内会没有变化，
		// 可能会给用户造成程序没响应的错觉，
		// 所以开发者需要对5+内核启动到5+应用页面显示之间的这段事件进行处理

		@Override
		public Object onCreateSplash(Context pContextWrapper) {
			splashView = new SplashView(activity, 
				BitmapFactory.decodeResource(activity.getResources(), R.drawable.splash));
			if(rootView != null) {
				rootView.addView(splashView);
				splashView.showWaiting();
			}
			return null;
		}

		@Override
		public void onCloseSplash() {
			if(rootView != null) {
				rootView.removeView(splashView);
			}
		}
		
	}
}


