package com.tuidian.tech.zma.lock.protocol;

/**
 * A general response.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class Response extends Packet {
	
	/** 错误码 - 命令操作成功 */
	public final static int RES_OK       = 0x00;
	/** 错误码 - 命令签名错误 */
	public final static int RES_ER_SIGN  = 0x01;
	/** 错误码 - 命令CRC错误 since 1.6.0 */
	public final static int RES_ER_CRC   = 0x02;
	/** 错误码 - 命令格式错误 since 1.6.0 */
	public final static int RES_ER_FORMAT= 0x04;
	/** 错误码 - 锁未写入甄码 since 1.6.0 */
	public final static int RES_ER_NOCODE= 0x10;
	/** 错误码 - 锁已发生故障 */
	public final static int RES_ER_FAULT = 0xFF;
	
	protected int result;

	public Response(final boolean encrypted, byte cmdId) {
		super(encrypted, (byte)(0x10 |cmdId));
	}

	@Override
	protected void doParse()throws ProtocolException {
		/* 协议格式：
		 * 1字节：响应标识 
		 * 1字节：响应状态 
		 *  0x00 命令操作OK，
		 *  0x01 命令签名错误，
		 *  0x02 命令CRC错误，
		 *  0x04 命令格式错误，
		 *  0x10 锁未写入甄码，
		 *  0xFF 锁已发生故障。
		 *  since 1.6.0.
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
			return "命令操作成功";
		}
		if(RES_ER_FAULT == res){
			return "锁已发生故障";
		}
		if((RES_ER_SIGN & res) != 0){
			return "命令签名错误";
		}
		if((RES_ER_CRC & res) != 0){
			return "命令CRC错误";
		}
		if((RES_ER_FORMAT & res) != 0){
			return "命令格式错误";
		}
		if((RES_ER_NOCODE & res) != 0){
			return "锁未写入甄码";
		}
		return "未知响应错误";
	}
	
}
