package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The reset lock command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class ResetLock extends Packet {
	
	private String zcSign;
	
	public ResetLock(final boolean encrypted) {
		super(encrypted, CMD_RESET);
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
