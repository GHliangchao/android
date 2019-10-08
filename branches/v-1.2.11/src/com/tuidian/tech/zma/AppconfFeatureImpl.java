package com.tuidian.tech.zma;

import static com.tuidian.app.zma.util.ByteUtil.appendBytes;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.tuidian.app.zma.util.ILog;

import android.util.Base64;
import io.dcloud.common.DHInterface.IWebview;
import io.dcloud.common.DHInterface.StandardFeature;
import io.dcloud.common.util.JSUtil;

/**
 * App configuration plugin.
 * 
 * @author wep
 * @since 2017/05/09
 *
 */
public class AppconfFeatureImpl extends StandardFeature{
	
	protected static final String TAG = "AppconfFeature";
	protected static final String PLAT= "Android";
	
	public String sign(final IWebview webview, final JSONArray params){
		ILog.d(TAG, "sign(): enter");
		// in: {package, version}
		// out:{package, version, plat, sign, signTMS}
		try {
			final String pkg = params.optString(0);
			final String ver = params.getString(1);
			final String pla = PLAT;
			final String tms = System.currentTimeMillis() + "";
			final String key = "1iop^u6i3lq#f51iJLr0i#h2+wP0s*k!";
			// sign
			final int pl = pkg.length(), vl = ver.length(), al = pla.length();
			final int tl = tms.length(), kl = key.length();
			byte buf[] = new byte[pl + vl + al + tl + kl];
			int i = 0;
			appendBytes(buf, i, pkg);
			i += pl;
			appendBytes(buf, i, ver);
			i += vl;
			appendBytes(buf, i, pla);
			i += al;
			appendBytes(buf, i, tms);
			i += tl;
			appendBytes(buf, i, key);
			final MessageDigest digest = MD();
			digest.update(buf);
			buf = null;
			final String sign = 
				Base64.encodeToString(digest.digest(), Base64.NO_WRAP);
			// ok
			final JSONObject json = new JSONObject()
			.put("package", pkg)
			.put("version", ver)
			.put("sign",    sign)
			.put("plat",	pla)
			.put("signTMS", tms);
			return (JSUtil.wrapJsVar(json));
		} catch (final Exception e) {
			ILog.e(TAG, "sign()", e);
			final JSONObject json = new JSONObject();
			try {
				json.put("message", "出错了~");
			} catch (JSONException cause) {}
			return (JSUtil.wrapJsVar(json));
		}
	}
	
	private final static MessageDigest MD() throws NoSuchAlgorithmException{
		return (MessageDigest.getInstance("SHA-256"));
	}
	
}

