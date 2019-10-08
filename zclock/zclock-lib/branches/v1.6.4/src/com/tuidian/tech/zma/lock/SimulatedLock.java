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
import com.tuidian.tech.zma.lock.protocol.Response;
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
	final static int VERSION = 0x16, LOCK_VERSION = 0x10;
	
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
	
	// NFC
	private byte[] nfcBuffer = "None".getBytes();
	
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
		final Packet cmd = command;
		cmd.writeBytes(block);
		if(init){
			final int len = cmd.parseLength();
			cmd.setLength(len);
		}
		final int pos = cmd.position(), len = cmd.getRealPacketLength();
		Logger.debugf(TAG, "cmd-id = 0x%02X, position = %d, pkg-length = %d", cmd.id, pos, len);
		if(pos >= len){
			cmd.setCompleted(true);
			onReadCompleted();
		}
	}

	private void newCommand(final byte[] block) {
		final byte cmdId = block[2];
		if(CMD_HANDS == cmdId){
			encrypted = false;
		}
		command = new Packet(encrypted, cmdId);
		read(block, true);
	}

	private void onReadCompleted() {
		final byte cmdId = command.id;
		int result = Response.RES_OK;
		final boolean crcER = !command.checkCRC();
		if(crcER){
			result |= Response.RES_ER_CRC;
		}else{
			// 包体解密 since 2018-03-17 pzp
			if(encrypted){
				command.setLockKey(new String(lockey));
				command.decrypt();
			}
		}
		Logger.debugf(TAG, "cmd-id = 0x%02X, encrypted = %s, crcER = %s", 
				                                cmdId, encrypted, crcER);
		//* Response always not encrypted since 2018-03-27 pzp
		switch(cmdId){
		case CMD_HANDS:
			command.position(2).readByte();
			final int protoVer = command.readByte();
			if(protoVer > VERSION){
				status |= 0x08;
			}
			encrypted = (command.readByte() & 0x01) != 0;
			Logger.debugf(TAG, "onReadCompleted(): encrypted = %s", encrypted);
			if(encrypted){
				status |= Packet.STATUS_ENCRYPTED;
			}else{
				status &= ~Packet.STATUS_ENCRYPTED;
			}
			// response
			{
				final byte[] pubSeed = new byte[5];
				ByteUtil.readInt(random.nextInt(), pubSeed, 1, LITTLE_ENDIAN);
				response = new HandshakeResponse();
				response.position(2)
				.writeByte(response.id)
				.writeByte(result)
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
			// 0. check-CRC
			if(crcER){
				response = newResultResponse(result);
				break;
			}
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
					response = newResultResponse(Response.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check zcode sign when open - success <-");
			}
			// 2. 开锁
			status = (byte)((status & (~Packet.STATUS_CLOSED)) | Packet.STATUS_OPEN);
			// 3. 响应
			response = newResultResponse(Response.RES_OK);
			break;
		case CMD_RCODE:
			final boolean noCode = (Packet.STATUS_REUSABLE&status) != 0;
			response = new ReadZcodeResponse(false);
			response.position(2)
			.writeByte(response.id)
			.writeByte(crcER?result:(noCode? Response.RES_ER_NOCODE: result))
			.writeBytes(crcER?new byte[9]:code)
			.writeLong(crcER?0L:zcTime)
			.writeString(crcER?"":caName)
			.writeString(crcER?"":certSn)
			.writeString(crcER?"":zcUsername)
			.writeString(crcER?"":zcTitle);
			break;
		case CMD_WCODE:
			// 0. check-CRC
			if(crcER){
				response = newResultResponse(result);
				break;
			}
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
						response = newResultResponse(Response.RES_ER_SIGN);
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
			response = newResultResponse(Response.RES_OK);
			break;
		case CMD_CLOCK:
			// 关锁
			if(crcER){
				response = newResultResponse(result);
				break;
			}
			status = (byte)((status & (~Packet.STATUS_OPEN)) | Packet.STATUS_CLOSED);
			response = newResultResponse(Response.RES_OK);
			break;
		case CMD_RESET:
			if(crcER){
				response = newResultResponse(result);
				break;
			}
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
					response = newResultResponse(Response.RES_ER_SIGN);
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
			response = newResultResponse(Response.RES_OK);
			break;
		case CMD_LOCAT:
			response = new LocateResponse(false, command.id);
			response.position(2)
			.writeByte(response.id)
			.writeByte(crcER?result:Response.RES_OK)
			.writeShort(crcER?0:((random.nextInt()&0x01)==0?-1:1)*random.nextInt(180))
			.writeInt(crcER?0:random.nextInt())
			.writeShort(crcER?0:((random.nextInt()&0x01)==0?-1:1)*random.nextInt(180))
			.writeInt(crcER?0:random.nextInt());
			break;
		case CMD_MODKEY:
			if(crcER){
				response = newResultResponse(result);
				break;
			}
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
					response = newResultResponse(Response.RES_ER_SIGN);
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
			response = newResultResponse(Response.RES_OK);
			break;
		case CMD_UPGSWT:
			if(crcER){
				response = newResultResponse(result);
				break;
			}
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
					response = newResultResponse(Response.RES_ER_SIGN);
					break;
				}
				Logger.debugf(TAG, "onReadCompleted(): Check lock sign when switch upgrade - success <-");
			}
			// 2. 切换
			// -- 升级切换略
			// 3. 响应
			response = newResultResponse(Response.RES_OK);
			break;
		default:
			throw new RuntimeException("Unsupport command id: " + cmdId);
		}
		final int len = response.calcCurrentLength();
		Logger.debugf(TAG, "cmd-id = 0x%02X, rsp-id = 0x%02X, rsp-len = %d", cmdId, response.id, len);
		response.setLength(len);
		// Encrypt since 2018-03-17 pzp
		//*Response always not encrypted since 2018-03-27 pzp
		//if(CMD_HANDS != cmdId && encrypted){
		//	response.setLockKey(new String(lockey));
		//	response.encryptDirect().serialize();
		//	return;
		//}
		response.serializeCompleted();
	}
	
	private Packet newResultResponse(final int result){
		final Packet response = new Response(false, command.id);
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
				Logger.debugf(TAG, "Cleanup command environments");
				encrypted = false;
				pubSeed   = null;
				status   &= ~Packet.STATUS_ENCRYPTED;
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
		Logger.debugf(TAG, "Cleanup connection environments");
		encrypted = false;
		pubSeed   = null;
		command   = null;
		response  = null;
		status   &= ~Packet.STATUS_ENCRYPTED;
		return this;
	}

	public byte[] nfcRead() {
		return nfcBuffer;
	}

	public SimulatedLock nfcWrite(final byte[] buf) {
		this.nfcBuffer = buf;
		return this;
	}
	
}
