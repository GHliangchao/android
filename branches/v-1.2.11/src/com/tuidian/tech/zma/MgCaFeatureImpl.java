package com.tuidian.tech.zma;

import java.io.IOException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.android.ftsafe.audioKey.FtBankLoader;
import com.ftsafe.keyinterface.FTCallback;
import com.ftsafe.keyinterface.FTCallback.UICallbackType;
import com.ftsafe.keyinterface.FTUserCertInfo;
import com.ftsafe.keyinterface.FTUserDeviceType;
import com.ftsafe.keyinterface.FTUserErrCode;
import com.ftsafe.keyinterface.FTUserLanguageType;
import com.ftsafe.keyinterface.FTUserSignAlg;
import com.ftsafe.keyinterface.IKeyInterface;
import com.tuidian.app.zma.util.FileTool;
import com.tuidian.app.zma.util.FtConfig;
import com.tuidian.app.zma.util.ILog;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.StandardFeature;
import io.dcloud.common.util.JSUtil;

public class MgCaFeatureImpl extends StandardFeature {

	protected static final String TAG = "MgCaFeature";
	/* OK, success */
	/* ER: 1, Error - */
	protected static final int OK = 0, ER = 1;
	
	/*NO_CERT:没有证书 */
	/*LENG_CONN_SUCCESS: 蓝牙key连接成功*/
	/*LENG_CERT_EXPIRED: 证书已过期*/
	protected static final int LENG_NO_CERT      = 0;
	protected static final int LENG_CONN_SUCCESS = 1;
	protected static final int LENG_CERT_EXPIRED = 2;
	protected static final int LENG_PWD_ERROR    = 3;

	private final String mJarPath = "/data/data/com.tuidian.tech.zma/ftKey_Api.jar";
	protected Context context;
	private IKeyInterface ftInterface;
	private List<FTUserCertInfo> mCertInfoArray;
	private FTUserSignAlg signAlg = FTUserSignAlg.FTM_RSA_SHA1;
	private FTUserLanguageType languageType = FTUserLanguageType.LANUAGE_ZH;
	private String libVersion;
	private String cbackID;
	private String certsn;
	private boolean needP7 = false;

	public void onStart(Context ctx, Bundle savedInstanceState, String[] rtArgs) {
		/**
		 * 如果要在应用启动时进行初始化，可以继承这个方法，并在properties.
		 * xml文件的service节点添加扩展插件的注册即可触发onStart方法
		 */
		super.onStart(ctx, savedInstanceState, rtArgs);
		Log.d(TAG, "mgonStart(): context = " + ctx);
	}

	public void connect(final IWebview webview, final JSONArray params) throws JSONException {
		cbackID = params.optString(0);
		final String sn = params.optString(1);
		final String lang = params.optString(2);
		ILog.d(TAG, "connect,sn=" + sn+",lang = "+lang);
		tryInitContext(webview);
		ftInterface.connectKey(context, sn, 30, new FTCallback<String, Void>() {

			@Override
			public void onResult(FTUserErrCode errorCode, String result, Void arg2) {
				ILog.d(TAG, "connectKey(): errorCode = " + errorCode);
				// @since liujun 2018-03-02 
				final String ers = judgeZhAndEnMessage(errorCode, result, lang);
				try {
					if (FTUserErrCode.FT_BT_CONNECT_SUCCESS == errorCode) {
						ftInterface.enumCert(context, new FTCallback<String, List<FTUserCertInfo>>() {

							@Override
							public void onResult(FTUserErrCode errorCode, String result,
									List<FTUserCertInfo> cInfoArray) {
								if (errorCode == FTUserErrCode.FT_SUCCESS) {
									if (cInfoArray == null) {
										try {
											result(webview, ER, judgeZhAndEnMsgError(lang, LENG_NO_CERT));
										} catch (JSONException e) {
											e.printStackTrace();
										}
										return;
									}
									mCertInfoArray.clear();
									ILog.d(TAG, "cInfoArray.size:" + cInfoArray.size());
									mCertInfoArray = cInfoArray;
									String time = mCertInfoArray.get(0).Time.substring(8, 16);
									try {
										Date date = new Date();
										final DateFormat dfmt = new SimpleDateFormat("yyyyMMdd");
										Date nowDate = dfmt.parse(time);
										if (nowDate.getTime() >= new Date().getTime()) {
											int day = differentDays(date, nowDate);
											if (day <= 30) {
												result(webview, OK, day + "");
											} else {
												result(webview, OK, judgeZhAndEnMsgError(lang, LENG_CONN_SUCCESS));
											}
										} else {
											result(webview, ER, judgeZhAndEnMsgError(lang, LENG_CERT_EXPIRED));
										}
									} catch (JSONException e) {
										e.printStackTrace();
									} catch (ParseException e) {
										e.printStackTrace();
									}
								} else {
									try {
										result(webview, ER, judgeZhAndEnMsgError(lang, LENG_NO_CERT));
									} catch (JSONException e) {
										e.printStackTrace();
									}
									return;
								}
							}

							@Override
							public void onShowUI(com.ftsafe.keyinterface.FTCallback.UICallbackType arg0, String arg1) {
							}

						});
					} else {
						result(webview, ER, ers);
					}
				} catch (JSONException e) {
					e.printStackTrace();
				}
			}

			@Override
			public void onShowUI(com.ftsafe.keyinterface.FTCallback.UICallbackType arg0, String arg1) {
				// TODO Auto-generated method stub

			}

		});

	}
	
	public static String Bytes2HexString(byte[] b) {
		String ret = "";

		for (int i = 0; i < b.length; i++) {
			String hex = Integer.toHexString(b[i] & 0xFF);

			if (hex.length() == 1) {
				hex = '0' + hex;
			}

			ret += hex;
		}
		return ret;
	}

	private int differentDays(Date date1, Date date2) { 
	    Calendar cal1 = Calendar.getInstance();
	    cal1.setTime(date1);
	        
	    Calendar cal2 = Calendar.getInstance();
	    cal2.setTime(date2);
	    int day1= cal1.get(Calendar.DAY_OF_YEAR);
        int day2 = cal2.get(Calendar.DAY_OF_YEAR);
        
        int year1 = cal1.get(Calendar.YEAR);
        int year2 = cal2.get(Calendar.YEAR);
        if(year1 != year2)   //不同年
        {
            int timeDistance = 0 ;
            for(int i = year1 ; i < year2 ; i ++)
            {
                if(i%4==0 && i%100!=0 || i%400==0)    //闰年            
                {
                    timeDistance += 366;
                }
                else    //不是闰年
                {
                    timeDistance += 365;
                }
            }
            
            return timeDistance + (day2-day1) ;
        }
        else    //同一年
        {
            //System.out.println("判断day2 - day1 : " + (day2-day1));
            return day2-day1;
        }
	}

	public void sign(final IWebview webview, final JSONArray params) throws JSONException {
		cbackID = params.optString(0);
		final String signData = params.optString(1);// 签名原文
		final String lang = params.optString(2);
		ftInterface.enumCert(context, new FTCallback<String, List<FTUserCertInfo>>() {

			@Override
			public void onResult(FTUserErrCode errorCode, String result, List<FTUserCertInfo> cInfoArray) {
				if (errorCode == FTUserErrCode.FT_SUCCESS) {
					if (cInfoArray == null) {
						try {
							result(webview, ER, judgeZhAndEnMsgError(lang, LENG_NO_CERT));
						} catch (JSONException e) {
							e.printStackTrace();
						}
						return;
					}
					mCertInfoArray.clear();
					ILog.d(TAG, "cInfoArray.size:" + cInfoArray.size());
					mCertInfoArray = cInfoArray;
					final ProgressDialog signPd = new ProgressDialog(context);
					signPd.setCancelable(false);
					certsn = Bytes2HexString(mCertInfoArray.get(0).SN);
					int length=certsn.length();
					if(length>32){
						certsn=certsn.substring(length-32, length);
					}
					ILog.d(TAG, "signData=" + signData);
					// 加入语言判断@since liujun 2018-03-08
					if(lang.equals("zh")){
					    languageType = FTUserLanguageType.LANUAGE_ZH;
					}else{
					    languageType = FTUserLanguageType.LANGUAGE_EN;
					}
					ftInterface.sign(context, mCertInfoArray.get(0), signAlg, languageType, signData, needP7,
							new FTCallback<String, Integer>() {

								@Override
								public void onResult(FTUserErrCode errorCode, String result, Integer pinTimes) {
									ILog.d(TAG, "sign(): errorCode = " + errorCode);
									String ers = "";
									int status = OK;
									if (errorCode == FTUserErrCode.FT_SUCCESS) {
										status = OK;
										ers = result+"*"+certsn;
									} else if (errorCode == FTUserErrCode.FT_PASSWORD_WRONG) {
										status = ER;
//										ers = "密码错误，剩余次数为" + pinTimes + "次。";
										ers = judgeZhAndEnMsgError(lang, LENG_PWD_ERROR, pinTimes);
									} else {
										status = ER;
//										ers = result;
										ers = judgeZhAndEnMessage(errorCode, result, lang);
									}
									try {
										result(webview, status, ers);
									} catch (JSONException e) {
										e.printStackTrace();
									}
								}

								@Override
								public void onShowUI(com.ftsafe.keyinterface.FTCallback.UICallbackType uiCallbackType,
										String promptMsg) {

									ILog.d(TAG, "safe");
									if (uiCallbackType == UICallbackType.FT_CLOSE_LOADING) { // 关闭提示弹框
										ILog.d(TAG, "safe1");
										try {
											Thread.sleep(1000L);
										} catch (InterruptedException e) {
											// ignore
										}
										if (signPd.isShowing()) {
											signPd.dismiss();
										}
									} else if (uiCallbackType == UICallbackType.FTF_CHECK_SIGN) {
										ILog.d(TAG, "safe22");
										if (FtConfig.deviceType == FTUserDeviceType.FT_COMMTYPE_BT4) {
											ILog.d(TAG, "safe44" + promptMsg);
											signPd.setMessage(getUICallbackTypeMsg(uiCallbackType, promptMsg, lang)); // 等待时Ukey操作时提示信息
										}
										if (!signPd.isShowing()) {
											ILog.d(TAG, "safe55");
											signPd.show();
										}
										ILog.d(TAG, "safe88");
									} else if(uiCallbackType == UICallbackType.FT_SIGNNING){ // 正在签名的信息
									    signPd.setMessage(getUICallbackTypeMsg(uiCallbackType, promptMsg, lang));
									    if(!signPd.isShowing()){
                                            signPd.show();
									    }
									} else if(uiCallbackType == UICallbackType.FT_GET_TOKEN_INFO){
									    signPd.setMessage(getUICallbackTypeMsg(uiCallbackType, promptMsg, lang));
									    if(!signPd.isShowing()){
									        signPd.show();
									    }
									}else {
										signPd.setMessage(promptMsg);
										ILog.d(TAG, "safe66:" + promptMsg);
										if (!signPd.isShowing()) {
											ILog.d(TAG, "safe77");
											signPd.show();
										}
									}

								}

							});
				} else {
					try {
						result(webview, ER, judgeZhAndEnMsgError(lang, LENG_NO_CERT));
					} catch (JSONException e) {
						e.printStackTrace();
					}
					return;
				}
			}

			@Override
			public void onShowUI(com.ftsafe.keyinterface.FTCallback.UICallbackType arg0, String arg1) {
			}

		});
	}
	
	private void result(IWebview webview, int ok, String mesage) throws JSONException {
		ILog.d(TAG, "error(): begin");
		final JSONObject rep = new JSONObject().put("result", ok).put("message", mesage);
		JSUtil.execCallback(webview, cbackID, rep, JSUtil.OK, false);
	}

	public Context getContext() {
		return context;
	}

	public void setContext(Context context) {
		this.context = context;
	}

	public String getLibVersion() {
		return libVersion;
	}

	public void setLibVersion(String libVersion) {
		this.libVersion = libVersion;
	}

	public String getCbackID() {
		return cbackID;
	}

	public void setCbackID(String cbackID) {
		this.cbackID = cbackID;
	}

	final synchronized Context tryInitContext(final IWebview webview) {
		final Context ctx = context;
		if (ctx == null) {
			final Activity activity;
			context = activity = webview.getActivity();
			Log.d(TAG, "tryInitContext: context = " + activity);
			try {
				FileTool.makeFilePath(context, "ftKey_Api.jar");
			} catch (IOException e) {
				Log.e(TAG, "error=" + e.getMessage());
			} catch (Exception e) {
				Log.e(TAG, "mg makeFilePath error=" + e.getMessage());
			}
			ftInterface = FtBankLoader.getInstance(context, mJarPath);
			Log.d(TAG, "instance222");
			ftInterface.initialize(context, FTUserDeviceType.FT_COMMTYPE_BT4);
			Log.d(TAG, "ftInterface=" + ftInterface);
			FtConfig.deviceType = FTUserDeviceType.FT_COMMTYPE_BT4;
			mCertInfoArray = new ArrayList<FTUserCertInfo>();
			return context;
		}
		return ctx;
	}

	public String getCertsn() {
		return certsn;
	}

	public void setCertsn(String certsn) {
		this.certsn = certsn;
	}
	
	/**
	 * 解析Ukey 签名，回调的信息 ShowUI
	 * @param uiCallbackType
	 * @param promptMsg
	 * @param lang
	 * @return
	 */
    public String getUICallbackTypeMsg(UICallbackType uiCallbackType, String promptMsg, String lang){
        ILog.d(TAG, uiCallbackType+"--"+promptMsg + "--" + lang);
        String msg = "";
        if(lang.equals("zh")){ // 中文
            switch (uiCallbackType) {
                case FTF_CHECK_SIGN:
                    msg = "请核对UKey屏幕上显示的内容是否正确，如确认请按“OK”键，否则按“C”键取消";
                    break;
                case FT_SIGNNING:
                    msg = "正在签名...";
                    break;
                case FT_GET_TOKEN_INFO:
                    msg = "正在获取设备信息...";
                    break;
                default:
                    msg = promptMsg;
                    break;
            }
        } else { // 英文
            switch (uiCallbackType) {
                case FTF_CHECK_SIGN:
                    msg = "Please check whether the content displayed on the UKey screen is correct, if confirmed, please press \"OK\" key, otherwise press \"C\" key to cancel.";
                    break;
                case FT_SIGNNING:
                    msg = "Signing...";
                    break;
                case FT_GET_TOKEN_INFO:
                    msg = "Getting device information...";
                    break;
                default:
                    msg = promptMsg;
                    break;
            }
        }
        return msg;
    }
	
	/**
	 * 得到中文信息 @since liujun 2018-03-02
	 * @param mark 中英文标识
	 * @return 根据FTUserErrCode来得到中文的提示信息
	 */
	private String getZhMessage(FTUserErrCode errorCode, String result){
	    ILog.d(TAG, "getZhMessage start: errorCode = " + errorCode +",result:" + result);
	    String ers = "" ;
	    switch (errorCode) {
        case FT_BT_CONNECT_SUCCESS:
            ers = "蓝牙key连接成功";
            break;
        case FT_BT_DISCONNECT:
            // 断开连接
            ers = "蓝牙key已断开";
            break;
        case FT_PHONE_BT_CLOSE:
            ers = "请打开手机蓝牙";
            break;
        case FT_OPERATION_TIMEOUT:
            ers = "蓝牙key未找到，请打开设备";
            break;
        case FT_ENERGY_LOW:
            ers = result;
            break;
        default:
            ers = result;
            break;
        }
	    ILog.d(TAG, "getZhMessage end: msg"+ers);
	    return ers;
	}
	
	private String getEnMessage(FTUserErrCode errorCode, String result){
	    ILog.d(TAG, "getEnMessage start: errorCode = " + errorCode +",result:" + result);
	    String ers = "";
	    switch (errorCode) {
	    case FT_SUCCESS:
	        ers = "Successful operation";
	        break;
	    case FT_OPERATION_FAILED:
	        ers = "Operation failed";
	        break;
	    case FT_NO_DEVICE:
	        ers = "The device is not connected.";
	        break;
	    case FT_DEVICE_BUSY:
	        ers = "Busy";
	        break;
	    case FT_INVALID_PARAMETER:
	        ers = "Parameter error";
	        break;
	    case FT_PASSWORD_INVALID:
	        ers = "Incorrect password";
	        break;
	    case FT_USER_CANCEL:
	        ers = "The client cancels the operation.";
	        break;
	    case FT_OPERATION_TIMEOUT:
            ers = "Bluetooth key not found, please open the device.";
            break;
	    case FT_NO_CERT:
	        ers = "No certificate or corresponding key pair found.";
	        break;
	    case FT_CERT_INVALID:
	        ers = "Certificate format is incorrect.";
	        break;
	    case FT_OTHER_ERROR:
	        ers = "Other mistakes";
	        break;
	    case FT_PIN_LOCK:
	        ers = "PIN code lock";
	        break;
	    case FT_OPERATION_INTERRUPT:
	        ers = "The operation is interrupted (such as incoming calls, etc.)";
	        break;
	    case FT_COMM_ERROR:
	        ers = "Communication error";
	        break;
	    case FT_ENERGY_LOW:
	        ers = "The equipment is not enough power to communicate.";
	        break;
	    case FT_INVALID_DEVICE_TYPE:
	        ers = "Device type does not match.";
	        break;
	    case FT_CERT_EXPIRED:
	        ers = "Certificate expired";
	        break;
	    case FT_CERT_NOT_FROM_FUTURE:
	        ers = "Certificate is not valid";
	        break;
	    case FT_NO_RECORD_PERMISSION:
	        ers = "No recording rights";
	        break;
	    case FT_COMM_TIMEOUT:
	        ers = "Communication time out";
	        break;
	    case FT_SN_NOTMATCH:
	        ers = "The serial numbers do not match";
	        break;
	    case FT_SAME_PASSWORD:
	        ers = "New and old passwords are the same.";
	        break;
	    case FT_PASSWORD_INVALID_LENGTH:
	        ers = "Wrong password length";
	        break;
	    case FT_CERT_NOTMATCH:
	        ers = "Did not match the certificate";
	        break;
	    case FT_PHONE_BT_CLOSE:
	        ers = "Please open the phone bluetooth";
	        break;
	    case FT_BLE_PLATFORM_NOT_SUPPORT_BLE:
	        ers = "This device does not support the Bluetooth 4.0 protocol";
	        break;
	    case FT_BLE_CANCEL_CONNECT_DEVICE:
	        ers = "Unlink the device";
	        break;
	    case FT_SIGN_MESSAGE_ERROR:
	        ers = "Signed message format is incorrect.";
	        break;
	    case FT_SIGN_ALG_ERROR:
	        ers = "The signature algorithm is wrong.";
	        break;
	    case FT_BT_CONNECT_SUCCESS:
	        ers = "Bluetooth key connection is successful.";
	        break;
	    case FT_BT_DISCONNECT:
	        ers = "Bluetooth key is disconnected.";
	        break;
	    case FT_LOCATION_CLOSE:
	        ers = "Android 6.0 location service is not turned on.";
	        break;
	    case FT_DEFAULT_PIN:
	        ers = "The device password is the initial password.";
	        break;
	    case FT_NOT_DEFAULT_PIN:
	        ers = "The device password is not the initial password.";
	        break;
	    case FT_HAS_PHONE_CALL:
	        ers = "Get cut off";
	        break;
        default:
            ers = result;
            break;
        }
	    ILog.d(TAG, "getEnMessage end: msg"+ers);
	    return ers;
	}
	
	// @since liujun 2018-03-02
	// 根据中英文标识来判断返回信息是中文还是英文
	private String judgeZhAndEnMessage(FTUserErrCode errorCode, String result, String lang){
	    ILog.d(TAG, "judgeZhAndEnMessage start : lang = "+lang);
	    if(lang.equals("zh")){
	        ILog.d(TAG, "judgeZhAndEnMessage :lang =" + lang );
	        return getZhMessage(errorCode, result);
	    }
	    ILog.d(TAG, "judgeEnAndEnMessage :lang =" + lang );
	    return getEnMessage(errorCode, result);
	}
	
	private String judgeZhAndEnMsgError(String lang, int msg){
	    return judgeZhAndEnMsgError(lang, msg, -1);
	}
	
	private String judgeZhAndEnMsgError(String lang, int msg, int count){
	    ILog.d(TAG, "judgeZhAndEnMsgError start:lang = "+lang +", msg = "+msg +", count = "+count);
	    String ers = "";
	    if(lang.equals("zh")){ // 中文标识
	        switch(msg){
    	        case LENG_NO_CERT:
    	            ers = "没有证书";
    	            break;
    	        case LENG_CONN_SUCCESS:
    	            ers = "蓝牙key连接成功";
    	            break;
    	        case LENG_CERT_EXPIRED:
    	            ers = "证书已过期";
    	            break;
    	        case LENG_PWD_ERROR:
    	            ers = "密码错误，剩余次数为"+count+"次";
    	            break;
    	        default :
    	            ers = "参数错误";
    	            break;
	        }
	        ILog.d(TAG, "judgeZhAndEnMsgError end:ers = "+ers);
	    }else{
    	    // 英文标识
    	    switch(msg){
                case LENG_NO_CERT:
                    ers = "No certificate";
                    break;
                case LENG_CONN_SUCCESS:
                    ers = "Bluetooth key connection is successful.";
                    break;
                case LENG_CERT_EXPIRED:
                    ers = "Certificate expired";
                    break;
                case LENG_PWD_ERROR:
                    ers = "Wrong password, the number of remaining is "+count+" times";
                    break;
                default :
                    ers = "Parameter error";
                    break;
            }
    	    ILog.d(TAG, "judgeEnAndEnMsgError end:ers = "+ers);
	    }
	    return ers;
	}
	
}