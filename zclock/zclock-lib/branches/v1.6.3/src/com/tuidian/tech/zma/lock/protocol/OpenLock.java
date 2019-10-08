package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The open lock command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class OpenLock extends Packet {
	
	private String zcSign;
	
	public OpenLock(final boolean encrypted) {
		super(encrypted, CMD_OLOCK);
	}
	
	@Override
	protected Packet serializeBody()throws UnsupportedEncodingException {
		writeBytes(ByteUtil.parsehex(zcSign));
		return this;
	}

	public String getZcSign() {
		return zcSign;
	}

	public void setZcSign(String zcSign) {
		this.zcSign = zcSign;
	}
	
}
