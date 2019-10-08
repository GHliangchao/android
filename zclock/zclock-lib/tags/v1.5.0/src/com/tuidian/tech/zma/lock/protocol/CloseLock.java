package com.tuidian.tech.zma.lock.protocol;

/**
 * The close lock command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class CloseLock extends Packet {

	public CloseLock() {
		super(CMD_CLOCK);
	}
	
	@Override
	public CloseLock serialize(){
		position(2).writeByte(id);
		setLength(position()-2);
		super.serialize();
		return this;
	}
	
}
