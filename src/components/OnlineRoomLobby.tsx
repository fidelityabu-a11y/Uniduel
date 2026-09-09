import React, { useState } from 'react';
import { DuelRoom, updateDuelPlayerName } from '../utils/duelRoomService';
import { NIGERIAN_UNIVERSITIES } from '../data/syllabusQuestions';
import {
  Users2,
  Copy,
  Check,
  Crown,
  Swords,
  Radio,
  ArrowRight,
  ExternalLink,
  Sparkles,
  LogOut,
  Zap,
  Clock,
  Edit3,
  X
} from 'lucide-react';

interface OnlineRoomLobbyProps {
  room: DuelRoom;
  myPlayerId: string;
  isHost: boolean;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
}

export const OnlineRoomLobby: React.FC<OnlineRoomLobbyProps> = ({
  room,
  myPlayerId,
  isHost,
  onStartMatch,
  onLeaveRoom
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Contestant name editing in lobby
  const [isEditingMyName, setIsEditingMyName] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editUni, setEditUni] = useState<string>('');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?duelRoom=${room.id}`
    : `/?duelRoom=${room.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.id).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const openTestTab = () => {
    window.open(inviteUrl, '_blank');
  };

  const handleStartEdit = () => {
    if (isHost) {
      setEditName(room.host.name);
      setEditUni(room.host.university);
    } else if (room.guest) {
      setEditName(room.guest.name);
      setEditUni(room.guest.university);
    }
    setIsEditingMyName(true);
  };

  const handleSaveEdit = async () => {
    const finalName = editName.trim() || (isHost ? 'Host Contestant' : 'Challenger');
    setIsSavingName(true);
    await updateDuelPlayerName({
      roomId: room.id,
      playerId: myPlayerId,
      name: finalName,
      university: editUni
    });
    setIsSavingName(false);
    setIsEditingMyName(false);
  };

  const hasGuest = Boolean(room.guest);

  return (
    <div id="online-room-lobby" className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#091533] via-[#0b193d] to-[#091533] border border-[#1a2e61] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              Live Match Lobby
            </span>
            <span className="text-xs text-blue-300/70 font-mono">
              {room.questionCount} Questions • 10s Rapid-Fire
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Challenge Room: <span className="text-cyan-400 font-mono tracking-wider">{room.id}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-room-code-btn"
            onClick={copyCode}
            className="px-3.5 py-2 rounded-xl bg-[#0e1e47] hover:bg-[#14295f] border border-[#1f3875] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Copy Room Code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>

          <button
            id="copy-invite-link-btn"
            onClick={copyLink}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Participant Presence Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-300 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-cyan-400" />
            Contestant Roster (2 Required)
          </h3>
          <span className="text-xs text-blue-300/70">
            {hasGuest ? '🟢 2 of 2 Contestants Ready' : '🟡 1 of 2 Waiting for Friend'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Host Card (Slot 1) */}
          <div
            id="lobby-host-card"
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#0c1a40] to-[#070e24] border border-cyan-500/40 shadow-lg shadow-cyan-500/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Host
                </span>
                {room.host.id === myPlayerId && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {room.host.id === myPlayerId && !isEditingMyName && (
                  <button
                    id="edit-host-name-btn"
                    onClick={handleStartEdit}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 transition-all"
                    title="Edit Contestant Name"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Name
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Connected & Ready
                </span>
              </div>
            </div>

            {room.host.id === myPlayerId && isEditingMyName ? (
              <div className="space-y-2 p-3 rounded-xl bg-[#091533] border border-cyan-500/50">
                <div>
                  <label className="text-[10px] text-cyan-300 font-bold block mb-1">Edit Your Contestant Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#070e24] border border-cyan-500 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    placeholder="Enter your name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cyan-300 font-bold block mb-1">Edit University</label>
                  <select
                    value={editUni}
                    onChange={(e) => setEditUni(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#070e24] border border-[#1f3875] text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {NIGERIAN_UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingMyName(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button
                    id="save-host-name-btn"
                    onClick={handleSaveEdit}
                    disabled={isSavingName}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow"
                  >
                    <Check className="w-3 h-3" /> {isSavingName ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-lg font-black text-white truncate">
                  {room.host.name}
                </div>
                <div className="text-xs text-blue-300/80 font-medium truncate">
                  🏛️ {room.host.university}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#162752] flex items-center justify-between text-[11px] text-blue-300/70">
              <span>Buzzer Position: Left (P1)</span>
              <span className="text-cyan-400 font-mono font-bold">10 pts / correct</span>
            </div>
          </div>

          {/* Guest Card (Slot 2) */}
          {hasGuest && room.guest ? (
            /* Guest Connected View */
            <div
              id="lobby-guest-connected-card"
              className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#0c2e35] to-[#071924] border border-emerald-500/50 shadow-lg shadow-emerald-500/15 space-y-4 animate-in fade-in zoom-in-95 duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Swords className="w-3 h-3 text-emerald-400" /> Challenger
                  </span>
                  {room.guest.id === myPlayerId && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {room.guest.id === myPlayerId && !isEditingMyName && (
                    <button
                      id="edit-guest-name-btn"
                      onClick={handleStartEdit}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-all"
                      title="Edit Contestant Name"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Name
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Participant Joined!
                  </span>
                </div>
              </div>

              {room.guest.id === myPlayerId && isEditingMyName ? (
                <div className="space-y-2 p-3 rounded-xl bg-[#091533] border border-emerald-500/50">
                  <div>
                    <label className="text-[10px] text-emerald-300 font-bold block mb-1">Edit Your Contestant Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#070e24] border border-emerald-500 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="Enter your name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-300 font-bold block mb-1">Edit University</label>
                    <select
                      value={editUni}
                      onChange={(e) => setEditUni(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#070e24] border border-[#1f3875] text-white text-xs focus:outline-none focus:border-emerald-400"
                    >
                      {NIGERIAN_UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingMyName(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      id="save-guest-name-btn"
                      onClick={handleSaveEdit}
                      disabled={isSavingName}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow"
                    >
                      <Check className="w-3 h-3" /> {isSavingName ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-lg font-black text-white truncate flex items-center gap-2">
                    {room.guest.name}
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xs text-emerald-200/80 font-medium truncate">
                    🏛️ {room.guest.university}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#123832] flex items-center justify-between text-[11px] text-emerald-300/80">
                <span>Buzzer Position: Right (P2)</span>
                <span className="font-semibold text-emerald-400">Ready to Compete!</span>
              </div>
            </div>
          ) : (
            /* Guest Waiting Radar View */
            <div
              id="lobby-guest-waiting-card"
              className="relative overflow-hidden p-5 rounded-2xl bg-[#081024] border border-dashed border-[#1f3875] flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Slot Open
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  Waiting for Opponent...
                </span>
              </div>

              {/* Radar pulse center */}
              <div className="py-2 text-center space-y-2">
                <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                  <div className="relative w-10 h-10 rounded-full bg-[#0d1f48] border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                    <Swords className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <p className="text-xs text-blue-200/80 max-w-xs mx-auto">
                  Share your room code <strong className="text-white font-mono">{room.id}</strong> or link with a friend. This card will immediately turn green when they join!
                </p>
              </div>

              {/* Quick test tab button */}
              <div className="pt-2 border-t border-[#142347] flex items-center justify-between">
                <span className="text-[10px] text-blue-300/60">Testing on 1 computer?</span>
                <button
                  onClick={openTestTab}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  title="Open friend invite link in a new browser tab to test 1v1 right now"
                >
                  <ExternalLink className="w-3 h-3" />
                  Test Join in New Tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-5 rounded-2xl bg-[#091433] border border-[#182a57] space-y-4">
        {hasGuest ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Both Contestants in Arena!
              </div>
              <p className="text-xs text-blue-200/70">
                {isHost
                  ? 'Click Launch below to begin the live head-to-head showdown.'
                  : 'Host will launch the match momentarily. Prepare your speed!'}
              </p>
            </div>

            {isHost ? (
              <button
                id="launch-1v1-duel-btn"
                onClick={onStartMatch}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer transform hover:scale-[1.02]"
              >
                <Swords className="w-4 h-4" />
                <span>LAUNCH 1v1 DUEL NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-5 py-2.5 rounded-xl bg-[#0e1d44] border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                Waiting for host to launch...
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-blue-300/80">
              Room Link: <span className="text-cyan-300 font-mono select-all">{inviteUrl}</span>
            </div>

            <button
              onClick={copyLink}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied Link!' : 'Copy Invite Link'}
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-[#142347] flex items-center justify-between">
          <button
            onClick={onLeaveRoom}
            className="text-xs text-rose-300/80 hover:text-rose-200 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Room
          </button>

          <span className="text-[11px] text-blue-300/50">
            Real-time synchronization active • No refresh required
          </span>
        </div>
      </div>
    </div>
  );
};
