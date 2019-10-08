package com.tuidian.tech.zma.lock.protocol;

/**
 * The handshake command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月8日
 *
 */
public class Handshake extends Packet {
	
	public final static int VERSION_15 = 0x15;
	public final static int VERSION    = VERSION_15;
	
	public final static int REQ_ENCRYPTED = 0x01;
	
	protected int request;
	
	public Handshake() {
		super(false, CMD_HANDS);
	}
	
	public int getRequest() {
		return request;
	}

	public Handshake setRequest(int request) {
		this.request = request;
		return this;
	}
	
	public Handshake writeVersion(){
		writeByte(VERSION);
		return this;
	}
	
	@Override
	public Handshake serialize(){
		position(2).writeByte(id);
		writeVersion().writeByte(getRequest());
		setLength(position()-2);
		super.serialize();
		return this;
	}
	
}
