package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The write zcode command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class WriteZcode extends Packet {
	
	private String zcode;
	private String zcSign, zcKey;
	private long zcTime;
	private String caName = "", certSn = "";
	private String zcUsername = "", zcTitle = "";
	
	public WriteZcode(final boolean encrypted) {
		super(encrypted, CMD_WCODE);
	}
	
	@Override
	protected Packet serializeBody()throws UnsupportedEncodingException {
		 writeBytes(ByteUtil.parsehex(zcSign))
		.writeBytes(ByteUtil.parsehex(zcKey))
		.writeBytes(Zcode.encode(zcode))
		.writeLong(zcTime)
		.writeString(caName)
		.writeString(certSn)
		.writeString(zcUsername)
		.writeString(zcTitle);
		return this;
	}

	public String getZcode() {
		return zcode;
	}

	public void setZcode(String zcode) {
		this.zcode = zcode;
	}

	public String getZcSign() {
		return zcSign;
	}

	public void setZcSign(String zcSign) {
		this.zcSign = zcSign;
	}

	public String getZcKey() {
		return zcKey;
	}

	public void setZcKey(String zcKey) {
		this.zcKey = zcKey;
	}

	public long getZcTime() {
		return zcTime;
	}

	public void setZcTime(long zcTime) {
		this.zcTime = zcTime;
	}

	public String getCaName() {
		return caName;
	}

	public void setCaName(String caName) {
		this.caName = caName;
	}

	public String getCertSn() {
		return certSn;
	}

	public void setCertSn(String certSn) {
		this.certSn = certSn;
	}

	public String getZcUsername() {
		return zcUsername;
	}

	public void setZcUsername(String zcUsername) {
		this.zcUsername = zcUsername;
	}

	public String getZcTitle() {
		return zcTitle;
	}

	public void setZcTitle(String zcTitle) {
		this.zcTitle = zcTitle;
	}
	
}
