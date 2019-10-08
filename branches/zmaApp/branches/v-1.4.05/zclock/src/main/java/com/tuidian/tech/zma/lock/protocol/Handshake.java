package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;

/**
 * The handshake command.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月8日
 *
 */
public class Handshake extends Packet {
	
	public final static int VERSION_15 = 0x15;
	/** Version 1.6 since 2018-03-13 */
	public final static int VERSION_16 = 0x16;
	
	public final static int VERSION    = VERSION_16;
	
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
	
	@Override
	protected Packet serializeBody()throws UnsupportedEncodingException {
		writeByte(VERSION)
		.writeByte(getRequest());
		return this;
	}
	
}
