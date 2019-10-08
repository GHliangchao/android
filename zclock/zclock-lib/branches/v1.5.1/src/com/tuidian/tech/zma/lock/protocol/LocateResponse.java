package com.tuidian.tech.zma.lock.protocol;

/**
 * The locate response.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public class LocateResponse extends ResultResponse {
	
	private double lng, lat;

	public LocateResponse(boolean encrypted, byte cmdId) {
		super(encrypted, cmdId);
	}
	
	@Override
	protected void doParse()throws ProtocolException {
		super.doParse();
		/* +协议格式：
		 * 2字节：经度整数部分
		 * 4字节：经度小数部分
		 * 2字节：纬度整数部分
		 * 4字节：纬度小数部分
		 */
		short i = (short)readShort();
		long f  = readInt() & 0xFFFFFFFFL;
		lng = Double.parseDouble(i+"."+f);
		
		i = (short)readShort();
		f = readInt() & 0xFFFFFFFFL;
		lat = Double.parseDouble(i+"."+f);
	}
	
	public double getLng() {
		return lng;
	}

	public double getLat() {
		return lat;
	}

}
