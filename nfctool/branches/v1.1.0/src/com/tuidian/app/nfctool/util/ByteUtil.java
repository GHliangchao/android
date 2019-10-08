package com.tuidian.app.nfctool.util;

/**
 * Byte utils such as byte buffer dump.
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-25
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
	
	public final static String dumphex(final byte[] buffer){
        return dumphex(buffer, 0, buffer.length, false);
    }
	
	public final static String dumphex(final byte[] buffer,  boolean upperCase){
        return dumphex(buffer, 0, buffer.length, upperCase);
    }
	
	public final static String dumphex(final byte[] buffer, final int offset, final int length){
	    return dumphex(buffer, offset, length, false);
	}
	
	public final static String dumphex(final byte[] buffer, final int offset, final int length, boolean upperCase){
        final StringBuilder sb = new StringBuilder(32);
        final String fmt = upperCase? "%02X": "%02x";
        for(int i = offset; i < length; ++i){
            sb.append(String.format(fmt, buffer[i]));
        }
        return sb.toString();
	}
	
}

