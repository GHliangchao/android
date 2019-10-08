package com.tuidian.tech.zma.lock.protocol;

import com.tuidian.tech.zma.lock.util.ByteUtil;

/**
 * The handshake response.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月9日
 *
 */
public class HandshakeResponse extends Response {
	
	private int protocolVersion, lockVersion;
	private int status, battery;
	private String seed, zcode = "";
	
	public HandshakeResponse() {
		super(false, CMD_HANDS);
	}
	
	public int getProtocolVersion() {
		return protocolVersion;
	}

	public int getLockVersion() {
		return lockVersion;
	}

	public int getStatus() {
		return status;
	}

	public int getBattery() {
		return battery;
	}

	public String getSeed() {
		return seed;
	}

	public String getZcode() {
		return zcode;
	}
	
	@Override
	protected void doParse()throws ProtocolException {
		/* 协议格式：
		 * 1字节：响应标识 
		 * 1字节：响应状态（since 1.6.0）
		 * 1字节：通信协议版本
		 * 1字节：甄码锁版本号
		 * 1字节：甄码锁当前状态
		 * 1字节：甄码锁当前电量
		 * 4字节：随机字符串
		 * 9字节：当前甄码编码
		 */
		position(2);
		final int rid = readByte();
		if(rid != id){
			throw new ProtocolException("Handshake response id not matched: " + rid);
		}
		// + result since 1.6.0
		result = readByte();
		protocolVersion = readByte();
		String error = null;
		if(protocolVersion <= Handshake.VERSION_15){
			error = "Lock's protocol version must bigger than v" + versionf(Handshake.VERSION_15);
		}
		lockVersion = readByte();
		status = readByte();
		battery= readByte();
		
		final byte[] buf = Zcode.newBuffer();
		readBytes(buf, 0, 4);
		{
			StringBuilder sbuf = new StringBuilder();
			ByteUtil.dumphex(sbuf, buf, 0, 4);
			seed = sbuf.toString();
		}
		
		readBytes(buf);
		zcode = Zcode.decode(buf);
		if(error != null){
			throw new ProtocolException(error);
		}
	}

	public String getProtocolVersions() {
		return (versionf(getProtocolVersion()));
	}
	
	public String getLockVersions() {
		return (versionf(getLockVersion()));
	}
	
	public String getStatusText(){
		final StringBuilder sbuf = new StringBuilder();
		final int stat = this.status;
		
		if((stat & STATUS_REUSABLE) != 0){
			sbuf.append("可重用");
		}
		if((stat & STATUS_AUTHORIZED) != 0){
			sbuf.append("授权状态");
		}
		if((stat & STATUS_FAULTED) != 0){
			sbuf.append("故障状态");
		}
		if((stat & STATUS_VINCOMP) != 0){
			sbuf.append(" 版本不兼容");
		}
		
		if((stat & STATUS_OPEN) != 0){
			sbuf.append(" 开锁");
		}
		if((stat & STATUS_CLOSED) != 0){
			sbuf.append(" 关锁");
		}
		
		if((stat & STATUS_ENCRYPTED) != 0){
			sbuf.append(" 加密");
		}
		return sbuf.toString();
	}
	
	public final static String versionf(final int version){
		return (String.format("%x.%x", (version>>4)&0x0F, version&0x0F));
	}

}
