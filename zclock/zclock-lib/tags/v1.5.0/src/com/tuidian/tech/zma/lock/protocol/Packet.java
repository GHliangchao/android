package com.tuidian.tech.zma.lock.protocol;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import com.tuidian.tech.zma.lock.util.ByteUtil;
import com.tuidian.tech.zma.lock.util.CRCUtil;

/**
 * Protocol packet.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月8日
 *
 */
public class Packet {
	
	public final static int MAX_LEN = 1020;
	public final static int BLK_LEN = 20;
	
	public final static String ENCODING = "UTF-8";
	
	// --- Status code ------------------------------------------
	/** 可重用  */
	public final static int STATUS_REUSABLE   = 0x01;
	/** 授权状态  */
	public final static int STATUS_AUTHORIZED = 0x02;
	/** 故障状态 */
	public final static int STATUS_FAULTED    = 0x04;
	/** 版本不兼容 */
	public final static int STATUS_VINCOMP    = 0x08;
	/** 开锁状态 */
	public final static int STATUS_OPEN       = 0x10;
	/** 关锁状态 */
	public final static int STATUS_CLOSED     = 0x20;
	/** 加密 */
	public final static int STATUS_ENCRYPTED  = 0x40;
	
	// --- Command code -----------------------------------------
	/** 握手命令 */
	public final static byte CMD_HANDS = 0x00;
	/** 写入甄码 */
	public final static byte CMD_WCODE = 0x01;
	/** 打开甄码锁 */
	public final static byte CMD_OLOCK = 0x02;
	/** 读取甄码 */
	public final static byte CMD_RCODE = 0x03;
	/** 关闭甄码锁 */
	public final static byte CMD_CLOCK = 0x04;
	/** 重置甄码锁 */
	public final static byte CMD_RESET = 0x05;
	/** 上报当前位置 */
	public final static byte CMD_LOCAT = 0x06;
	/** 修改锁密钥 */
	public final static byte CMD_MODKEY= 0x07;
	/** 升级切换 */
	public final static byte CMD_UPGSWT= 0x08;
	
	// --- Properties ---------------------------------------------
	public final boolean encrypted;
	private boolean completed; // a completed packet
	private Runnable timeoutHandler;
	
	// 辅助缓冲
	protected final ByteBuffer numBuf = newByteBuffer(8);
	
	// IO缓冲
	public final byte id;
	protected int length;
	protected byte[] buffer;
	protected int pos;
	
	public Packet(final byte id){
		this(false, id, BLK_LEN);
	}
	
	public Packet(final boolean encrypted, final byte id){
		this(encrypted, id, BLK_LEN);
	}
	
	public Packet(final boolean encrypted, final byte id, final int bufferSize){
		this.encrypted = encrypted;
		this.id = id;
		if(bufferSize > MAX_LEN){
			throw new IllegalArgumentException("bufferSize too big: " + bufferSize);
		}
		if(bufferSize < BLK_LEN){
			this.buffer = new byte[BLK_LEN];
		}else{
			int blocks = (bufferSize / BLK_LEN);
			if((bufferSize % BLK_LEN) != 0){
				blocks += 1;
			}
			this.buffer = new byte[blocks * BLK_LEN];
		}
	}
	
	public Packet setLength(final int length){
		if(length < 0){
			throw new IllegalArgumentException("Length is negative: " + length);
		}
		this.length = length;
		return this;
	}
	
	public int parseLength(){
		numBuf.clear();
		numBuf.put(buffer, 0, 2);
		return (numBuf.getShort(0) & 0xFFFF);
	}
	
	public Packet position(final int position){
		if(position >= buffer.length){
			throw new IllegalArgumentException("Position too big: " + position);
		}
		this.pos = position;
		return this;
	}
	
	public int position(){
		return pos;
	}
	
	public Packet serialize(){
		return writeLength().writeCRC().position(0).setCompleted(true);
	}
	
	public Packet writeLength(){
		numBuf.putShort(0, (short)length);
		System.arraycopy(numBuf.array(), 0, buffer, 0, 2);
		return this;
	}
	
	public Packet writeCRC(){
		final int len = getRealLength();
		return writeByte(CRCUtil.crc8(buffer, 0, 2 + len));
	}
	
	public Packet writeByte(final int b){
		ensureCapacity(1);
		buffer[pos++] = (byte)b;
		return this;
	}
	
	public Packet writeBytes(final byte[] buf){
		return writeBytes(buf, 0, buf.length);
	}
	
	public Packet writeBytes(final byte[] buf, final int offset, final int length){
		ensureCapacity(length);
		System.arraycopy(buf, offset, buffer, pos, length);
		pos += length;
		return this;
	}
	
	public Packet writeShort(int i){
		numBuf.putShort(0, (short)i);
		return writeBytes(numBuf.array(), 0, 2);
	}
	
	public Packet writeInt(int i){
		numBuf.putInt(0, i);
		return writeBytes(numBuf.array(), 0, 4);
	}
	
	public Packet writeLong(long i){
		numBuf.putLong(0, i);
		return writeBytes(numBuf.array(), 0, 8);
	}
	
	public Packet writeString(final String s){
		try {
			final byte[] buf = s.getBytes(ENCODING);
			writeShort(buf.length);
			writeBytes(buf);
			return this;
		} catch (final UnsupportedEncodingException e) {
			// General not occurred
			throw new RuntimeException(e);
		}
	}
	
	public int readByte(){
		return (buffer[pos++] & 0xFF);
	}
	
	public int readShort() {
		final int size = 2;
		numBuf.clear();
		numBuf.put(buffer, pos, size);
		final int ret = numBuf.getShort(0) & 0xFFFF;
		pos += size;
		return ret;
	}
	
	public int readInt() {
		final int size = 4;
		numBuf.clear();
		numBuf.put(buffer, pos, size);
		final int ret = numBuf.getInt(0);
		pos += size;
		return ret;
	}
	
	public long readLong() {
		final int size = 8;
		numBuf.clear();
		numBuf.put(buffer, pos, size);
		final long ret = numBuf.getLong(0);
		pos += size;
		return ret;
	}
	
	public Packet readBytes(final byte[] buf){
		return (readBytes(buf, 0, buf.length));
	}
	
	public Packet readBytes(final byte[] buf, final int offset, final int length) {
		System.arraycopy(buffer, pos, buf, offset, length);
		pos += length;
		return this;
	}
	
	public String readString(){
		final int len = readShort();
		final byte[] buf = new byte[len];
		readBytes(buf);
		try {
			return (new String(buf, ENCODING));
		} catch (final UnsupportedEncodingException e) {
			// General not occurred
			throw new RuntimeException(e);
		}
	}
	
	public boolean hasRemaining(){
		return (pos < buffer.length);
	}
	
	public boolean checkCRC(){
		final int len = getRealLength();
		final byte crc = buffer[2 + len];
		return (crc == CRCUtil.crc8(buffer, 0, 2 + len));
	}
	
	public boolean isCompleted() {
		return completed;
	}

	public Packet setCompleted(boolean completed) {
		this.completed = completed;
		return this;
	}
	
	public Packet parse()throws ProtocolException {
		if(!completed){
			throw new IllegalStateException("The packet not completed");
		}
		if(encrypted){
			return this;
		}
		doParse();
		return this;
	}

	protected void doParse() throws ProtocolException {
		
	}
	
	public int getRealLength(){
		final int len = length;
		if(encrypted){
			final int rem = length % 16;
			return (length + ((rem == 0)? 0: (16-rem)/*Padding 0 number*/));
		}
		return len;
	}
	
	public Runnable getTimeoutHandler() {
		return timeoutHandler;
	}

	public void setTimeoutHandler(Runnable timeoutHandler) {
		this.timeoutHandler = timeoutHandler;
	}
	
	public String hexId(){
		return (String.format("%02X", (0xFF & id)));
	}
	
	protected Packet ensureCapacity(final int inc){
		if(inc == 0){
			return this;
		}
		if(inc < 0){
			throw new IllegalArgumentException("Length increment is negative: " + inc);
		}
		final byte[] buf = this.buffer;
		int cap = pos + inc;
		if(cap > buf.length){
			if((cap % BLK_LEN) != 0){
				cap = (cap / BLK_LEN + 1) * BLK_LEN;
			}
			if(cap > MAX_LEN){
				throw new IllegalArgumentException("Packet too length: " + cap);
			}
			final byte[] newBuf = new byte[cap];
			System.arraycopy(buf, 0, newBuf, 0, buf.length);
			this.buffer = newBuf;
		}
		return this;
	}

	public final static byte[] newBlockBuffer(){
		return (new byte[BLK_LEN]);
	}
	
	public final static ByteBuffer newByteBuffer(final int length){
		return ByteUtil.newByteBuffer(length, ByteOrder.BIG_ENDIAN);
	}
	
}
