import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Flex,
  Text,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { X, ShieldAlert } from 'lucide-react';
import { PortBruteMinigame } from './PortBruteMinigame';
import { BufferOverflowMinigame } from './BufferOverflowMinigame';
import { CipherBypassMinigame } from './CipherBypassMinigame';
import { SentryOverloadMinigame } from './SentryOverloadMinigame';
import { PlayerInventoryUpgrades } from '../../game/marketData';

export interface ActiveExploitSession {
  targetIp: string;
  targetHostname: string;
  exploit: 'port_brute' | 'buffer_overflow' | 'cipher_bypass' | 'sentry_overload';
  port: number;
}

interface MinigameOverlayProps {
  session: ActiveExploitSession | null;
  upgrades: PlayerInventoryUpgrades;
  onSuccess: (targetIp: string) => void;
  onFailure: (reason: string) => void;
  onCancel: () => void;
}

export const MinigameOverlay: React.FC<MinigameOverlayProps> = ({
  session,
  upgrades,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  if (!session) return null;

  // Base time limits with CPU Overclock modifier
  const cpuBonus = (upgrades.cpu_overclock || 0) * 4; // +4s per tier
  const baseTimes: Record<string, number> = {
    port_brute: 15 + cpuBonus,
    buffer_overflow: 18 + cpuBonus,
    cipher_bypass: 20 + cpuBonus,
    sentry_overload: 16 + cpuBonus,
  };

  const timeLimit = baseTimes[session.exploit] || 15;

  const renderMinigame = () => {
    switch (session.exploit) {
      case 'port_brute':
        return (
          <PortBruteMinigame
            timeLimit={timeLimit}
            onSuccess={() => onSuccess(session.targetIp)}
            onFailure={onFailure}
          />
        );
      case 'buffer_overflow':
        return (
          <BufferOverflowMinigame
            timeLimit={timeLimit}
            onSuccess={() => onSuccess(session.targetIp)}
            onFailure={onFailure}
          />
        );
      case 'cipher_bypass':
        return (
          <CipherBypassMinigame
            timeLimit={timeLimit}
            onSuccess={() => onSuccess(session.targetIp)}
            onFailure={onFailure}
          />
        );
      case 'sentry_overload':
        return (
          <SentryOverloadMinigame
            timeLimit={timeLimit}
            onSuccess={() => onSuccess(session.targetIp)}
            onFailure={onFailure}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={!!session} onClose={onCancel} isCentered size="lg" closeOnOverlayClick={false}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(5px)" />
      <ModalContent
        bg="rgba(10, 12, 20, 0.98)"
        border="1px solid #00f0ff"
        boxShadow="0 0 40px rgba(0, 240, 255, 0.25)"
        borderRadius="xl"
        p={2}
      >
        <ModalHeader borderBottom="1px solid rgba(0, 240, 255, 0.2)" pb={2.5}>
          <Flex justifyContent="space-between" alignItems="center">
            <Flex alignItems="center" gap={2}>
              <ShieldAlert size={18} color="#00f0ff" />
              <Text fontSize="sm" fontFamily="monospace" color="#00f0ff" letterSpacing="0.08em">
                INTRUSION_PAYLOAD_DEPLOYMENT
              </Text>
            </Flex>
            <Badge colorScheme="purple" fontSize="2xs">
              PORT {session.port} // {session.targetIp}
            </Badge>
          </Flex>
        </ModalHeader>

        <ModalBody py={4}>{renderMinigame()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
