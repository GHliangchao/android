package com.tuidian.tech.zma.lock.protocol;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import android.util.Base64;

/**
 * M+G code.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月6日
 *
 */
public class Zcode {
	
	public final static int ZCODE_LEN = 9;
	
	public final static byte[] newBuffer(){
		return (new byte[ZCODE_LEN]);
	}
	
	public final static byte[] encode(final String code){
		if(code.length() != 13){
			throw new IllegalArgumentException("code length error: " + code.length());
		}
		final int v = Integer.parseInt(code.substring(0, 1));
		if(v == 0){
			throw new IllegalArgumentException("version is zcode in zcode " + code);
		}
		
		final String z = code.substring(1);
		final ByteBuffer buffer = newByteBuffer(ZCODE_LEN);
		buffer.put(Base64.decode(z, Base64.NO_WRAP));
		
		final long c = buffer.getLong(0);
		buffer.put(0, (byte)v).putLong(1, c);
		return buffer.array();
	}
	
	public final static String decode(final byte[] buff, final int offset, final int length){
		if(length != ZCODE_LEN){
			throw new IllegalArgumentException("buffer length error: " + buff.length);
		}
		boolean hasCode = false;
		for(int i = 0; i < length; i++){
			final byte b = buff[offset + i];
			if(b != 0){
				hasCode = true;
				break;
			}
		}
		if(!hasCode){
			return "";
		}
		final ByteBuffer buffer = newByteBuffer(8);
		buffer.put(buff, offset + 1, length - 1);
		
		final int v = buff[offset] & 0xFF;
		final long c = buffer.getLong(0);
		
		buffer.putLong(0, c);
		return (v + Base64.encodeToString(buffer.array(), Base64.NO_WRAP));
	}
	
	public final static String decode(final byte[] buff){
		return decode(buff, 0, buff.length);
	}
	
	final static ByteBuffer newByteBuffer(final int length){
		return ByteBuffer.allocate(length).order(ByteOrder.LITTLE_ENDIAN);
	}

}
