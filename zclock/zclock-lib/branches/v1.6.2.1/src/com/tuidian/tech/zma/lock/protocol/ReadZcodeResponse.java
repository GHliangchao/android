package com.tuidian.tech.zma.lock.protocol;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * The response of read ZMA code.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月9日
 *
 */
public class ReadZcodeResponse extends Response {
	
	private String zcode;
	private long zcTime;
	private String caName = "", certSn = "";
	private String zcUsername = "", zcTitle = "";

	public ReadZcodeResponse(final boolean encrypted) {
		super(encrypted, (byte)(0x10 | CMD_RCODE));
	}

	@Override
	protected void doParse()throws ProtocolException {
		/* 协议格式：
		 * 1字节：响应标识
		 * 1字节：响应状态（since 1.6.0）
		 * 9字节：甄码编码
		 * 8字节：甄码时间
		 * 	距离epoch的秒数。
		 * 变长串：CA名称
		 * 变长串：证书序号
		 * 变长串：甄码用户名
		 * 变长串：甄码标题
		 */
		position(2);
		final int rid = readByte();
		if(rid != id){
			throw new ProtocolException("Read zcode id not matched: " + rid);
		}
		// since 1.6.0
		result = readByte();
		
		final byte[] buf = Zcode.newBuffer();
		readBytes(buf);
		zcode = Zcode.decode(buf);
		if("".equals(zcode)){
			return;
		}
		
		zcTime = readLong();
		caName = readString();
		certSn = readString();
		zcUsername = readString();
		zcTitle= readString();
	}

	public String getZcode() {
		return zcode;
	}

	public long getZcTime() {
		return zcTime;
	}

	public String getCaName() {
		return caName;
	}

	public String getCertSn() {
		return certSn;
	}

	public String getZcUsername() {
		return zcUsername;
	}

	public String getZcTitle() {
		return zcTitle;
	}
	
	public String getZcTimeText(){
		final DateFormat df = 
			new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
		return df.format(new Date(zcTime * 1000L));
	}
	
}
