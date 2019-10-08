package com.tuidian.tech.zma.lock.util;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import com.tuidian.tech.zma.lock.Consts;

import android.util.Log;

/**
 * Byte utils such as byte buffer dump.
 * 
 * @author pzp@maihesoft.com
 * @since 2016年5月11日
 *
 */
public final class ByteUtil {
	
	private ByteUtil(){
		
	}
	
	public final static byte[] appendBytes(final byte[] buf, final int offset, final String s){
		int k = offset;
		for(int i = 0, size = s.length(); i < size; ++i){
			final char c = s.charAt(i);
			buf[k++] = (byte)(c & 0xff);
		}
		return buf;
	}
	
	public final static void dumphex(final String tag, final byte[] buffer){
		dumphex(tag, buffer, 0, buffer.length);
	}
	
	public final static void dumphex(final String tag, final byte[] buffer, final int os, final int length){
		if(Consts.DEBUG){
			final int bhash = buffer.hashCode();
			//Log.d(tag, String.format("buffer#%x dumphex(): begin", bhash));
			System.out.println(String.format("[%s] buffer#%x dumphex(): begin", tag, bhash));
			final int LSIZE = 8;
			final StringBuilder sbuf = new StringBuilder(3 * LSIZE);
			for(int i = os; i < length; ++i){
				if(i != os && i % LSIZE == 0){
					Log.d(tag, sbuf.toString());
					sbuf.setLength(0);
				}
				sbuf.append(String.format("%02X ", buffer[i]));
			}
			if(sbuf.length() > 0){
				Log.d(tag, sbuf.toString());
			}
			//Log.d(tag, String.format("buffer#%x dumphex(): end", bhash));
			System.out.println(String.format("[%s] buffer#%x dumphex(): end", tag, bhash));
		}
	}
	
	public final static String dumphex(final byte[] buffer){
		return dumphex((StringBuilder)null, buffer, 0, buffer.length);
	}
	
	public final static String dumphex(final StringBuilder sbuf, final byte[] buffer){
		return dumphex(sbuf, buffer, 0, buffer.length);
	}
	
	public final static String dumphex(final StringBuilder sbuf, final byte[] buffer, 
			final int os, final int length){
		final StringBuilder buf = (sbuf==null ? new StringBuilder(length * 2) : sbuf);
		for(int i = os; i < length; ++i){
			buf.append(String.format("%02X", buffer[i]));
		}
		return buf.toString();
	}
	
	public final static String hexString(final byte[] a){
		final int size = a.length;
		final char buf[] = new char[size << 1];
		for(int i = 0; i < size; ++i){
			final byte b = a[i];
			char c;
			final int h = (b >> 4) & 0x0f;
			if(h < 0xa){
				c = (char)('0' + h);
			}else{
				c = (char)('a' + (h - 0xa));
			}
			buf[i << 1] = c;
			final int l = b & 0x0f;
			if(l < 0xa){
				c = (char)('0' + l);
			}else{
				c = (char)('a' + (l - 0xa));
			}
			buf[(i << 1) + 1] = c;
		}
		return new String(buf);
	}
	
	public final static byte[] parsehex(final String value) {
		final int size = value.length();
		final byte[] buff = new byte[size/2];
		for(int i = 0, j = 0; i < size; i += 2){
			final String v = value.substring(i, i+2);
			buff[j++] = (byte)Integer.parseInt(v, 16);
		}
		return buff;
	}
	
	public final static ByteBuffer newByteBuffer(final int length, final ByteOrder order){
		final ByteBuffer buffer = ByteBuffer.allocate(length);
		buffer.order(order);
		return buffer;
	}
	
	public final static void readInt(final int i, final byte[] buffer, final int offset, final ByteOrder order){
		final int size = 4;
		final ByteBuffer buf = newByteBuffer(size, order);
		buf.putInt(i);
		buf.flip();
		buf.get(buffer, offset, size);
	}
	
}
