package com.tuidian.tech.zma.lock.protocol;

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
	private String body;
	
	public SwitchUpgrade(final boolean encrypted) {
		super(encrypted, CMD_UPGSWT);
	}
	
	@Override
	public SwitchUpgrade serialize(){
		position(2);
		writeByte(id)
		.writeBytes(ByteUtil.parsehex(lockSign))
		.setLength(position() - 2);
		super.serialize();
		return this;
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
	
}
