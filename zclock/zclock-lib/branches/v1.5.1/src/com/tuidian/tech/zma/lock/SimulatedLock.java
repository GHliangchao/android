package com.tuidian.tech.zma.lock;

import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_CLOCK;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_HANDS;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_LOCAT;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_MODKEY;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_OLOCK;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_RCODE;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_RESET;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_UPGSWT;
import static com.tuidian.tech.zma.lock.protocol.Packet.CMD_WCODE;
import static java.nio.ByteOrder.*;

import java.util.Random;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;

import com.inuker.bluetooth.library.search.SearchResult;
import com.tuidian.tech.zma.lock.protocol.HandshakeResponse;
import com.tuidian.tech.zma.lock.protocol.LocateResponse;
import com.tuidian.tech.zma.lock.protocol.Packet;
import com.tuidian.tech.zma.lock.protocol.ReadZcodeResponse;
import com.tuidian.tech.zma.lock.protocol.ResultResponse;
import com.tuidian.tech.zma.lock.util.ByteUtil;
import com.tuidian.tech.zma.lock.util.Logger;
import com.tuidian.tech.zma.lock.util.SecurityUtil;

/**
 * A simulated lock for protocol debug intent.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月8日
 *
 */
public class SimulatedLock {
	final static String TAG = "simLock";
	
	final static String ADDRESS = "A9:B6:C9:D6:99:66";
	final static int VERSION = 0x15, LOCK_VERSION = 0x10;
	
	final String address;
	final BluetoothDevice device;
	
	private final Random random = new Random();
	
	// Lock status
	private byte status = 0x21;
	private byte[] code = new byte[9];
	private byte[] zcKey;
	private long zcTime;
	private String caName = "", certSn = "";
	private String zcTitle= "", zcUsername = "";
	private byte[] pubSeed;
	private byte[] lockey = Consts.LOCKEY_DEF.getBytes();
	
	// Connection management
	private Packet command, response;
	private boolean encrypted;
	
	public SimulatedLock(){
		this(ADDRESS);
	}
	
	public SimulatedLock(final String address){
		this.address = address;
		final BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		this.device = adapter.getRemoteDevice(address);
	}
	
	public SearchResult getSearchResult() {
		final Random rand = new Random();
		final SearchResult result = 
			new SearchResult(device, -rand.nextInt(100), scanRecord());
		return result;
	}

	private byte[] scanRecord() {
		final byte[] record = new byte[4 + 18 + 9];
		record[0] = 0x03;
		record[1] = 0x03;
		record[2] = (byte)0xE7;
		record[3] = (byte)0xFE;
		
		record[4] = 0x11;
		record[5] = (byte)0xFF;
		record[6] = status;
		int j = 7;
		final String[] addr = address.split(":");
		for(final String h: addr){
			record[j++] = (byte)Integer.parseInt(h, 16);
		}
		for(final byte b: code){
			record[j++] = b;
		}
		record[j++] = 0x08;
		record[j++] = 0x09;
		for(final byte b: ("M+G"+addr[4]+addr[5]).getBytes()){
			record[j++] = b;
		}
		return record;
	}
	
	public String getAddress() {
		return address;
	}

	public BluetoothDevice getDevice() {
		return device;
	}

	public void onRead(final byte[] block) {
		if(command == null){
			newCommand(block);
			return;
		}
		read(block, false);
	}

	private void read(byte[] block, final boolean init) {
		command.writeBytes(block);
		if(init){
			final int len = command.parseLength();
			command.setLength(len);
		}
		if(command.position() >= 2 + command.getRealLength() + 1){
			command.setCompleted(true);
			onReadCompleted();
		}
	}

	private void newCommand(final byte[] block) {
		command = new Packet(block[2]);
		read(block, true);
	}

	private void onReadCompleted() {
		if(command.checkCRC() == false){
			throw new RuntimeException("CRC错误");
		}
		switch(command.id){
		case CMD_HANDS:
			command.position(2).readByte();
			final int protoVer = command.readByte();
			if(protoVer > VERSION){
				status |= 0x08;
			}
			encrypted = (command.readByte() & 0x01) != 0;
			if(encrypted){
				status |= 0x40;
			}
			// response
			{
				final byte[] pubSeed = new byte[5];
				ByteUtil.readInt(random.nextInt(), pubSeed, 1, LITTLE_ENDIAN);
				response = new HandshakeResponse();
				response.position(2)
				.writeByte(response.id)
				.writeByte(VERSION)
				.writeByte(LOCK_VERSION)
				.writeByte(status)
				.writeByte(random.nextInt(100))
				.writeBytes(pubSeed, 1, 4)
				.writeBytes(code);
				this.pubSeed = pubSeed;
				if(Consts.DEBUG){
					Logger.debugf(TAG, "onReadCompleted(): new pulic seed = %s", ByteUtil.dumphex(pubSeed));
				}
			}
			break;
		case CMD_OLOCK:
			command.position(2).readByte();
			// 1. 验签
			{
				final byte[] zcSign = new byte[20];
				command.readBytes(zcSign);
				Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when open - begin ->");
				pubSeed[0] = command.id;
				boolean ok = SecurityUtil.sha1Verify(zcSign, zcKey, pubSeed);
				if(!ok){
					Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when open - error <-");
					response = newResultResponse(ResultResponse.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when open - success <-");
			}
			// 2. 开锁
			status = (byte)((status & (~Packet.STATUS_CLOSED)) | Packet.STATUS_OPEN);
			// 3. 响应
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		case CMD_RCODE:
			response = new ReadZcodeResponse(encrypted);
			response.position(2)
			.writeByte(response.id)
			.writeBytes(code)
			.writeLong(zcTime)
			.writeString(caName)
			.writeString(certSn)
			.writeString(zcUsername)
			.writeString(zcTitle);
			break;
		case CMD_WCODE:
			command.position(2).readByte();
			{
				final byte[] zcSign = new byte[20];
				command.readBytes(zcSign);
				if((Packet.STATUS_AUTHORIZED & status) != 0){
					Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when write - begin ->");
					pubSeed[0] = command.id;
					boolean ok = SecurityUtil.sha1Verify(zcSign, zcKey, pubSeed);
					if(!ok){
						Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when write - error <-");
						response = newResultResponse(ResultResponse.RES_ER_SIGN);
						break;
					}
					Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when write - success <-");
				}
			}
			zcKey = new byte[20];
			command.readBytes(zcKey);
			if(Consts.DEBUG){
				Logger.debugf(TAG, "onReadCompleted(): zcode-key when write = %s", ByteUtil.dumphex(zcKey));
			}
			command.readBytes(code);
			zcTime = command.readLong();
			caName = command.readString();
			certSn = command.readString();
			zcUsername = command.readString();
			zcTitle = command.readString();
			if((Packet.STATUS_REUSABLE & status) != 0){
				// reusable -> authorized
				status  =  (byte)((status & (~Packet.STATUS_REUSABLE)) | Packet.STATUS_AUTHORIZED);
			}
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		case CMD_CLOCK:
			// 关锁
			status = (byte)((status & (~Packet.STATUS_OPEN)) | Packet.STATUS_CLOSED);
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		case CMD_RESET:
			command.position(2).readByte();
			// 1. 验签
			{
				final byte[] zcSign = new byte[20];
				command.readBytes(zcSign);
				Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when reset - begin ->");
				pubSeed[0] = command.id;
				boolean ok = SecurityUtil.sha1Verify(zcSign, zcKey, pubSeed);
				if(!ok){
					Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when reset - error <-");
					response = newResultResponse(ResultResponse.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when reset - success <-");
			}
			// 2. 重置
			status = (byte)((status & (~Packet.STATUS_AUTHORIZED)) | Packet.STATUS_REUSABLE);
			code   = new byte[9];
			zcKey  = null;
			zcTime = 0;
			caName =  certSn = zcTitle = zcUsername = "";
			// 3. 响应
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		case CMD_LOCAT:
			response = new LocateResponse(encrypted, command.id);
			response.position(2)
			.writeByte(response.id)
			.writeByte(ResultResponse.RES_OK)
			.writeShort(((random.nextInt()&0x01)==0?-1:1)*random.nextInt(180))
			.writeInt(random.nextInt())
			.writeShort(((random.nextInt()&0x01)==0?-1:1)*random.nextInt(180))
			.writeInt(random.nextInt());
			break;
		case CMD_MODKEY:
			command.position(2).readByte();
			// 1. 验签
			{
				final byte[] lockSign = new byte[20];
				command.readBytes(lockSign);
				Logger.debugf(TAG, "onReadCompleted(): Check lock sign when modify key - begin ->");
				pubSeed[0] = command.id;
				final byte[] stages2 = SecurityUtil.sha1Key(lockey);
				boolean ok = SecurityUtil.sha1Verify(lockSign, stages2, pubSeed);
				if(!ok){
					Logger.debugf(TAG, "onReadCompleted(): Check lock sign when modify key - error <-");
					response = newResultResponse(ResultResponse.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check lock sign when modify key - success <-");
			}
			// 2. 改密
			{
				final byte[] key = new byte[16];
				command.readBytes(key);
				if(Consts.DEBUG){
					Logger.debugf(TAG, "onReadCompleted(): New lock key = %s", new String(key));
				}
				this.lockey = key;
			}
			// 3. 响应
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		case CMD_UPGSWT:
			command.position(2).readByte();
			// 1. 验签
			{
				final byte[] lockSign = new byte[20];
				command.readBytes(lockSign);
				Logger.debugf(TAG, "onReadCompleted(): Check lock sign when switch upgrade - begin ->");
				pubSeed[0] = command.id;
				final byte[] stages2 = SecurityUtil.sha1Key(lockey);
				boolean ok = SecurityUtil.sha1Verify(lockSign, stages2, pubSeed);
				if(!ok){
					Logger.debugf(TAG, "onReadCompleted(): Check lock sign when switch upgrade - error <-");
					response = newResultResponse(ResultResponse.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check lock sign when switch upgrade - success <-");
			}
			// 2. 切换
			// -- 升级切换略
			// 3. 响应
			response = newResultResponse(ResultResponse.RES_OK);
			break;
		default:
			throw new RuntimeException("Unsupport command id: " + command.id);
		}
		final int len = response.position() - 2;
		response.setLength(len);
		response.serialize();
	}
	
	private Packet newResultResponse(final int result){
		final Packet response = new ResultResponse(encrypted, command.id);
		response.position(2)
		.writeByte(response.id)
		.writeByte(result);
		return response;
	}
	
	public byte[] notifyData(){
		if(response == null){
			Logger.debugf(TAG, "notifyData(): no response data - reading");
			return null;
		}
		if(response.hasRemaining() == false){
			// Over
			Logger.debugf(TAG, "notifyData(): Send completed");
			if(command.id != Packet.CMD_HANDS){
				encrypted = false;
				pubSeed   = null;
			}
			command  = null;
			response = null;
			return null;
		}
		final byte[] block = Packet.newBlockBuffer();
		response.readBytes(block);
		return block;
	}

	public SimulatedLock onDisconnect() {
		encrypted = false;
		pubSeed   = null;
		command = null;
		response= null;
		return this;
	}
	
}
