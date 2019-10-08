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
	private String body;
	private String lockKey;
	
	public ModifyKey(final boolean encrypted) {
		super(encrypted, CMD_MODKEY);
	}
	
	@Override
	public ModifyKey serialize(){
		try {
			position(2);
			writeByte(id)
			.writeBytes(ByteUtil.parsehex(lockSign))
			.writeBytes(lockKey.getBytes(ENCODING))
			.setLength(position() - 2);
			super.serialize();
			return this;
		} catch (final UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
	}

	public String getLockSign() {
		return lockSign;
	}

	public void setLockSign(String lockSign) {
		this.lockSign = lockSign;
	}

	public String getBody() {
		return body;
	}

	public void setBody(final String body) {
		this.body = body;
	}
	
	public String getLockKey() {
		return lockKey;
	}

	public void setLockKey(String lockKey) {
		this.lockKey = lockKey;
	}
	
}
