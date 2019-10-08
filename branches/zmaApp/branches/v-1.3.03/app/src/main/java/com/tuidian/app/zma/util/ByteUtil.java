package com.tuidian.app.zma.util;

/**
 * Byte utils such as byte buffer dump.
 * 
 * @author pzp@maihesoft.com
 * @since 2016�?�?1�?
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
		if(ILog.debugEnabled()){
			final int bhash = buffer.hashCode();
			ILog.d(tag, String.format("buffer#%d dumphex(): begin", bhash));
			final int LSIZE = 8;
			final StringBuilder sbuf = new StringBuilder(3 * LSIZE);
			for(int i = os; i < length; ++i){
				if(i != os && i % LSIZE == 0){
					ILog.d(tag, sbuf.toString());
					sbuf.setLength(0);
				}
				sbuf.append(String.format("%02X ", buffer[i]));
			}
			if(sbuf.length() > 0){
				ILog.d(tag, sbuf.toString());
			}
			ILog.d(tag, String.format("buffer#%d dumphex(): end", bhash));
		}
	}
	
}

