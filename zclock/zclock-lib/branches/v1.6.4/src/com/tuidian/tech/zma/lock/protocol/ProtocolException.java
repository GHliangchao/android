package com.tuidian.tech.zma.lock.protocol;

/**
 * Protocol exception.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月9日
 *
 */
public class ProtocolException extends Exception {
	
	private static final long serialVersionUID = -7567938087806053058L;
	
	public ProtocolException(){
		
	}
	
	public ProtocolException(final String message){
		super(message);
	}

}
