package com.tuidian.tech.zma.lock.protocol;

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
	private String body;
	
	public ResetLock(final boolean encrypted) {
		super(encrypted, CMD_RESET);
	}
	
	@Override
	public ResetLock serialize(){
		position(2);
		writeByte(id)
		.writeBytes(ByteUtil.parsehex(zcSign))
		.setLength(position() - 2);
		super.serialize();
		return this;
	}

	public String getZcSign() {
		return zcSign;
	}

	public void setZcSign(String zcSign) {
		this.zcSign = zcSign;
	}

	public String getBody() {
		return body;
	}

	public void setBody(final String body) {
		this.body = body;
	}
	
}
