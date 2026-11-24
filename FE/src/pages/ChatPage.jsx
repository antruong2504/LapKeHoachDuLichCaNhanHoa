import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import { getSocket } from '../services/socket';
import {
  MessageSquare,
  Users,
  Plus,
  UserPlus,
  Send,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Tạo nhóm mới (E2E UI_24)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Modal Thêm thành viên (E2E UI_24)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberModalMsg, setMemberModalMsg] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Tải danh sách nhóm chat ban đầu
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await chatService.getMyGroups();
        if (res.success && Array.isArray(res.data)) {
          setGroups(res.data);
          if (res.data.length > 0) {
            setSelectedGroup(res.data[0]);
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Không thể tải danh sách nhóm chat.');
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [user, navigate]);

  // Khi chọn nhóm: lấy lịch sử tin nhắn & join room Socket.io
  useEffect(() => {
    if (!selectedGroup || !user) return;

    const socket = getSocket();
    const groupId = selectedGroup.id;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setErrorMsg('');
      try {
        const res = await chatService.getMessages(groupId);
        if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Không thể tải lịch sử tin nhắn của nhóm.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Tham gia room chat qua Socket.io (kèm userId để BE kiểm tra bảo mật)
    socket.emit('join_group', { groupId, userId: user.id });

    const handleNewMessage = (incomingMsg) => {
      if (incomingMsg.nhom_id?.toString() === groupId.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  tin_nhan_cuoi: {
                    id: incomingMsg.id,
                    noi_dung: incomingMsg.noi_dung,
                    created_at: incomingMsg.created_at,
                    nguoi_gui: incomingMsg.nguoi_gui,
                  },
                }
              : g
          )
        );
        setTimeout(scrollToBottom, 80);
      }
    };

    const handleChatError = (err) => {
      setErrorMsg(err.message || 'Lỗi kết nối phòng chat.');
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_error', handleChatError);

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('new_message', handleNewMessage);
      socket.off('chat_error', handleChatError);
    };
  }, [selectedGroup?.id, user]);

  // Gửi tin nhắn realtime qua Socket.io
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGroup || !user) return;

    const socket = getSocket();
    socket.emit('send_message', {
      nhom_id: selectedGroup.id,
      nguoi_gui_id: user.id,
      noi_dung: messageInput.trim(),
    });

    setMessageInput('');
  };

  // Tạo nhóm chat mới
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      const res = await chatService.createGroup({
        ten_nhom: newGroupName.trim(),
        thanh_vien_ids: [],
      });
      if (res.success && res.data) {
        setGroups((prev) => [res.data, ...prev]);
        setSelectedGroup(res.data);
        setNewGroupName('');
        setShowCreateGroupModal(false);
      }
    } catch (err) {
      alert(err.message || 'Không thể tạo nhóm chat.');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Mở modal thêm thành viên & tải danh sách gợi ý
  const handleOpenAddMember = async () => {
    setMemberIdentifier('');
    setMemberModalMsg('');
    setShowAddMemberModal(true);
    try {
      const res = await chatService.searchUsers('');
      if (res.success && Array.isArray(res.data)) {
        setSuggestedUsers(res.data);
      }
    } catch (_) {}
  };

  // Thêm thành viên vào nhóm hiện tại
  const handleAddMember = async (payload) => {
    if (!selectedGroup) return;
    setAddingMember(true);
    setMemberModalMsg('');
    try {
      const res = await chatService.addMember(selectedGroup.id, payload);
      if (res.success && res.data) {
        const newMember = res.data;
        setSelectedGroup((prev) => ({
          ...prev,
          thanh_viens: [...(prev.thanh_viens || []), newMember],
        }));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroup.id
              ? { ...g, thanh_viens: [...(g.thanh_viens || []), newMember] }
              : g
          )
        );
        setMemberModalMsg(res.message || 'Đã thêm thành viên thành công!');
        setMemberIdentifier('');
      }
    } catch (err) {
      setMemberModalMsg(err.message || 'Không thể thêm thành viên này.');
    } finally {
      setAddingMember(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    (g.ten_nhom || '').toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600">
              <MessageSquare className="w-4 h-4" />
              <span>Trò chuyện nhóm Realtime • PB12 (UI_24)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              Phòng chat <span className="text-teal-600">nhóm du lịch</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateGroupModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo nhóm</span>
          </button>
        </div>

        {/* Split Layout: Danh sách nhóm bên trái + Khung hội thoại bên phải */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[640px]">
          {/* CỘT TRÁI: DANH SÁCH NHÓM CHAT */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50 h-64 md:h-full">
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Tìm kiếm nhóm chat..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingGroups ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Bạn chưa tham gia nhóm nào. Bấm "Tạo nhóm" để bắt đầu!
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const isActive = selectedGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 ${
                        isActive ? 'bg-teal-50 border-l-4 border-teal-600' : 'hover:bg-white'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {group.ten_nhom}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                            {group.thanh_viens?.length || 1} TV
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {group.tin_nhan_cuoi
                            ? `${group.tin_nhan_cuoi.nguoi_gui?.ho_ten || 'Ai đó'}: ${
                                group.tin_nhan_cuoi.noi_dung
                              }`
                            : 'Chưa có tin nhắn nào'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG HỘI THOẠI REALTIME */}
          <div className="md:col-span-8 flex flex-col h-full bg-white overflow-hidden">
            {!selectedGroup ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  Chọn một nhóm ở danh sách bên trái để trò chuyện
                </p>
              </div>
            ) : (
              <>
                {/* Header Phòng Chat */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {selectedGroup.ten_nhom}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">
                      {selectedGroup.thanh_viens?.length || 1} thành viên:{' '}
                      {(selectedGroup.thanh_viens || [])
                        .map((tv) => tv.tai_khoan?.ho_ten)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddMember}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm thành viên</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="m-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Khung tin nhắn */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
                  {loadingMessages ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      Hãy gửi lời chào đầu tiên tới các thành viên trong nhóm!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.nguoi_gui?.id?.toString() === user?.id?.toString();
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2.5 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isMine && (
                            <img
                              src={
                                msg.nguoi_gui?.anh_dai_dien ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                              }
                              alt={msg.nguoi_gui?.ho_ten || 'User'}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          )}

                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs ${
                              isMine
                                ? 'bg-teal-600 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            {!isMine && (
                              <p className="text-[11px] font-bold text-teal-700 mb-0.5">
                                {msg.nguoi_gui?.ho_ten || 'Thành viên'}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm leading-relaxed break-words">
                              {msg.noi_dung}
                            </p>
                            <p
                              className={`text-[10px] mt-1 text-right ${
                                isMine ? 'text-teal-100' : 'text-slate-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form gửi tin nhắn */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-200 bg-white flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn trao đổi với nhóm..."
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL TẠO NHÓM MỚI */}
        {/* ======================================================== */}
        {showCreateGroupModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Tạo nhóm trò chuyện mới</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Tên nhóm du lịch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="VD: Team phượt Đà Nẵng cuối tuần"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold disabled:opacity-50"
                  >
                    {creatingGroup ? 'Đang tạo...' : 'Tạo nhóm ngay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL THÊM THÀNH VIÊN VÀO NHÓM */}
        {/* ======================================================== */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Thêm thành viên vào nhóm</h3>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {memberModalMsg && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{memberModalMsg}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (memberIdentifier.trim()) {
                      handleAddMember({ identifier: memberIdentifier.trim() });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                    placeholder="Nhập tên đăng nhập hoặc email..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={addingMember || !memberIdentifier.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Thêm
                  </button>
                </form>

                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                    Gợi ý thành viên hệ thống
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {suggestedUsers
                      .filter(
                        (u) =>
                          !selectedGroup?.thanh_viens?.some(
                            (tv) => tv.tai_khoan_id?.toString() === u.id?.toString()
                          )
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                u.anh_dai_dien ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                              }
                              alt={u.ho_ten}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{u.ho_ten}</p>
                              <p className="text-[11px] text-slate-400 truncate">@{u.ten_dang_nhap}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={addingMember}
                            onClick={() => handleAddMember({ tai_khoan_id: u.id })}
                            className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shrink-0"
                          >
                            + Mời
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
