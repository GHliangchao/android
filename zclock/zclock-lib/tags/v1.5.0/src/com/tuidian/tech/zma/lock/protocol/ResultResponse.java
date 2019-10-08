package com.tuidian.tech.zma.lock.protocol;

/**
 * A general result response.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class ResultResponse extends Packet {
	
	public final static int RES_OK       = 0x00;
	public final static int RES_ER_SIGN  = 0x01;
	public final static int RES_ER_PROTO = 0x02;
	public final static int RES_ER_FAULT = 0xFF;
	
	private int result;

	public ResultResponse(final boolean encrypted, byte cmdId) {
		super(encrypted, (byte)(0x10 |cmdId));
	}

	@Override
	protected void doParse()throws ProtocolException {
		/* 协议格式：
		 * 1字节：响应标识 
		 * 1字节：响应状态 
		 *  0x00 操作OK，
		 *  0x01 签名错误，
		 *  0x02 协议错误，
		 *  0xFF 锁故障。
		 */
		position(2);
		final int rid = readByte();
		if(rid != id){
			throw new ProtocolException("Response id not matched: " + rid);
		}
		result = readByte();
	}
	
	public int getResult() {
		return result;
	}
	
	public final boolean isOK(){
		return (RES_OK == result);
	}

	public String getMessage() {
		final int res = result;
		if(RES_OK == res){
			return "操作成功";
		}
		if((RES_ER_SIGN & res) != 0){
			return "签名错误";
		}
		if((RES_ER_PROTO & res) != 0){
			return "协议错误";
		}
		if((RES_ER_FAULT & res) != 0){
			return "锁故障";
		}
		return "未知错误";
	}
	
}
