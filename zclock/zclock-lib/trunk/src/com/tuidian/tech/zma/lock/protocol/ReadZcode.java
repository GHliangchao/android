package com.tuidian.tech.zma.lock.protocol;

/**
 * Read ZMA code.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月9日
 *
 */
public class ReadZcode extends Packet {

	public ReadZcode() {
		super(CMD_RCODE);
	}
	
}
