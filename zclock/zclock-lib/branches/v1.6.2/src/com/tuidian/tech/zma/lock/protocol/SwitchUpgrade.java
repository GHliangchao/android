package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The switch upgrade command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class SwitchUpgrade extends Packet {
	
	private String lockSign;
	
	public SwitchUpgrade(final boolean encrypted) {
		super(encrypted, CMD_UPGSWT);
	}
	
	@Override
	protected Packet serializeBody()throws UnsupportedEncodingException {
		writeBytes(ByteUtil.parsehex(lockSign));
		return this;
	}

	public String getLockSign() {
		return lockSign;
	}

	public void setLockSign(String lockSign) {
		this.lockSign = lockSign;
	}
	
}
