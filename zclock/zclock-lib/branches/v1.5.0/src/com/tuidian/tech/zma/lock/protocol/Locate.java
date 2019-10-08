package com.tuidian.tech.zma.lock.protocol;

/**
 * The locate command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class Locate extends Packet {

	public Locate() {
		super(CMD_LOCAT);
	}
	
	@Override
	public Locate serialize(){
		position(2).writeByte(id);
		setLength(position()-2);
		super.serialize();
		return this;
	}
	
}