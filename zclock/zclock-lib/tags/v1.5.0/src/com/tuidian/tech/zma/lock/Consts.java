package com.tuidian.tech.zma.lock;

/**
 * 常用常量。
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月2日
 *
 */
public final class Consts {
	
	private Consts(){
		// noop
	}
	
	final static String LOCKEY_DEF = "L5c$uE8T7w2+90*j";
	
	public final static String PROP_DEBUG = "lock.debug";
	
	/** Get the DEBUG value from java property since 2.3.1 - 2017-05-16 pzp */
	public final static boolean DEBUG = Boolean.parseBoolean(System.getProperty(PROP_DEBUG, "false"));
	
	/** 状态正常。*/
	public final static int ER_NONE    = 0x00;
	
	/** 一般错误。 */
	public final static int ER_ERROR   = -1;
	
	/** 连接已断开。*/
	public final static int ER_DISCON  = 0xFC;
	/** 执行已超时。*/
	public final static int ER_TIMEOUT = 0xFE;
	
}
