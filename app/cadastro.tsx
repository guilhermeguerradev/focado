import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { CampoTexto } from '@/components/CampoTexto';
import { TelaFormulario } from '@/components/TelaFormulario';
import {
  SENHA_MINIMA,
  semErros,
  validarCadastro,
  type ErrosFormulario,
} from '@/domain/validacaoCadastro';
import { cadastrar } from '@/services/autenticacao';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Tela de cadastro (PRD 1.4): nome, e-mail e senha.
// Sem confirmação de e-mail: ao criar a conta, o usuário já entra no app.
export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoCadastrar() {
    const errosEncontrados = validarCadastro({ nome, email, senha });
    setErros(errosEncontrados);
    setErroGeral(null);
    if (!semErros(errosEncontrados)) return;

    setEnviando(true);
    const { erro } = await cadastrar({ nome, email, senha });
    setEnviando(false);
    setErroGeral(erro);
  }

  return (
    <TelaFormulario titulo="Criar conta" subtitulo="Comece a medir seu tempo de estudo.">
      <CampoTexto
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        erro={erros.nome}
        placeholder="Como quer ser chamado?"
        autoCapitalize="words"
        autoComplete="name"
      />
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
        placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
        secureTextEntry
        autoComplete="new-password"
      />

      {erroGeral ? <Text style={styles.erroGeral}>{erroGeral}</Text> : null}

      <BotaoPrincipal titulo="Criar conta" onPress={aoCadastrar} carregando={enviando} />

      <Link href="/entrar" replace style={styles.link}>
        Já tem conta? <Text style={styles.linkDestaque}>Entrar</Text>
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
