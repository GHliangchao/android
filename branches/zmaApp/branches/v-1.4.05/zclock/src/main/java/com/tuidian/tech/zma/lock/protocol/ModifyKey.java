package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The modify lock key command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class ModifyKey extends Packet {
	
	private String lockSign;
	
	public ModifyKey(final boolean encrypted) {
		super(encrypted, CMD_MODKEY);
	}
	
	@Override
	protected Packet serializeBody()throws UnsupportedEncodingException {
		 writeBytes(ByteUtil.parsehex(lockSign))
		.writeBytes(lockKey.getBytes(ENCODING));
		return this;
	}
	
	public String getLockSign() {
		return lockSign;
	}

	public void setLockSign(String lockSign) {
		this.lockSign = lockSign;
	}

}
