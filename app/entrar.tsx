import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { CampoTexto } from '@/components/CampoTexto';
import { TelaFormulario } from '@/components/TelaFormulario';
import { semErros, validarLogin, type ErrosFormulario } from '@/domain/validacaoCadastro';
import { entrar } from '@/services/autenticacao';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Tela de login. Se der certo, o "porteiro" (app/_layout.tsx) percebe o login
// e leva o usuário para dentro do app sozinho.
export default function TelaEntrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    const errosEncontrados = validarLogin({ email, senha });
    setErros(errosEncontrados);
    setErroGeral(null);
    if (!semErros(errosEncontrados)) return;

    setEnviando(true);
    const { erro } = await entrar({ email, senha });
    setEnviando(false);
    setErroGeral(erro);
  }

  return (
    <TelaFormulario titulo="Entrar" subtitulo="Que bom te ver de novo! Bora estudar?">
      <CampoTexto
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <CampoTexto
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="current-password"
      />

      {erroGeral ? <Text style={styles.erroGeral}>{erroGeral}</Text> : null}

      <BotaoPrincipal titulo="Entrar" onPress={aoEntrar} carregando={enviando} />

      <Link href="/cadastro" replace style={styles.link}>
        Não tem conta? <Text style={styles.linkDestaque}>Criar conta</Text>
      </Link>
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  erroGeral: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
    textAlign: 'center',
  },
  link: {
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.textoSecundario,
    textAlign: 'center',
    paddingVertical: 8,
  },
  linkDestaque: {
    fontFamily: fontes.textoExtraNegrito,
    color: cores.primaria,
  },
});
