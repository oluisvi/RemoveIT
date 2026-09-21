# RemoveIT — Especificação de design

Data: 20 de setembro de 2026  
Status: aprovado para planejamento

## 1. Objetivo

Criar um aplicativo web em português que remova marcas d'água de imagens de forma real. O sistema deve analisar a imagem, sugerir automaticamente quais regiões provavelmente pertencem à marca d'água, permitir correções manuais e reconstruir o fundo com IA.

O produto destina-se somente a imagens que o usuário possua ou tenha autorização para editar. A confirmação dessa autorização é obrigatória antes do processamento.

## 2. Escopo do MVP

O MVP processa imagens JPG, PNG e WebP de até 20 MB. Inclui:

- envio por seleção de arquivo ou arrastar e soltar;
- validação do arquivo por conteúdo, tamanho e dimensões;
- detecção automática de textos, logos e sobreposições prováveis;
- visualização da máscara sugerida com pontuação de confiança;
- ferramentas para adicionar ou apagar áreas da máscara;
- ajuste de tamanho do pincel e suavidade das bordas;
- reconstrução das regiões mascaradas por inpainting;
- comparação interativa entre original e resultado;
- nova tentativa com a mesma máscara ou máscara corrigida;
- download do resultado em alta qualidade;
- histórico restrito à sessão atual.

Vídeo, contas, cobrança, armazenamento permanente e galeria pública não fazem parte do MVP.

## 3. Princípios do produto

1. **Controle humano:** a detecção automática sempre pode ser revisada antes de alterar a imagem.
2. **Clareza:** o sistema comunica incerteza, falhas e limitações sem prometer perfeição.
3. **Privacidade:** arquivos são temporários, metadados sensíveis são removidos e não há retenção permanente.
4. **Uso autorizado:** o fluxo exige confirmação explícita de propriedade ou permissão.
5. **Simplicidade:** existe um caminho principal curto do envio ao download.

## 4. Fluxo principal

1. O usuário abre a página inicial e aceita a confirmação de propriedade ou autorização.
2. Envia uma imagem suportada.
3. A API valida o conteúdo e remove metadados EXIF antes do processamento.
4. O pipeline de IA procura elementos que aparentam ser marcas d'água.
5. O editor exibe a máscara sugerida e a confiança da detecção.
6. O usuário aceita ou corrige a máscara com pincel e borracha.
7. A API envia a imagem normalizada e a máscara final para inpainting.
8. O usuário compara original e resultado.
9. O usuário baixa o resultado, corrige a máscara ou tenta novamente.
10. Originais, máscaras e resultados expiram e são apagados automaticamente.

## 5. Estados e caminhos alternativos

### Detecção

- **Confiança alta:** a máscara aparece pronta para revisão.
- **Confiança média:** a interface pede atenção às bordas e possíveis falsos positivos.
- **Confiança baixa ou nenhuma região:** o editor abre com ferramentas manuais e orientação objetiva.

### Processamento

- A interface mostra progresso e uma estimativa sem bloquear o cancelamento.
- Uma falha recuperável mantém a imagem e a máscara da sessão para nova tentativa.
- Uma falha definitiva explica a causa conhecida e oferece retorno seguro ao editor.
- O sistema nunca apresenta uma imagem parcialmente processada como resultado concluído.

### Arquivos inválidos

- Tipo não suportado, arquivo corrompido, dimensões incompatíveis e limite excedido recebem mensagens específicas.
- A extensão do arquivo não é considerada prova suficiente do formato.

## 6. Experiência e direção visual

O projeto é classificado como `PRODUCT_APP`, com ambição visual de nível 3: polido e distintamente branded, sem sacrificar previsibilidade.

A direção aprovada é clara e acolhedora:

- superfícies brancas e cinzas muito claras;
- violeta como cor de ação e reconhecimento da marca;
- tipografia legível, contemporânea e sem excesso decorativo;
- cantos moderadamente suaves, contornos discretos e sombras leves;
- bastante espaço em branco;
- linguagem direta e tranquilizadora;
- movimento restrito a feedback, progresso e transições de estado.

A experiência não deve parecer um painel técnico escuro, uma ferramenta de edição profissional excessivamente densa ou um site promocional genérico.

## 7. Estrutura da interface

### Página inicial

- marca RemoveIT e navegação mínima;
- título “Fotos limpas. Em poucos segundos.”;
- explicação curta do processo;
- área dominante de upload;
- formatos, limite e sinais de privacidade;
- confirmação de propriedade ou autorização colocada antes do processamento.

### Editor assistido

- indicador de etapas: Enviar, Revisar, Resultado;
- imagem como elemento central e dominante;
- máscara sobreposta com contraste ajustável;
- barra de ferramentas com detecção, pincel, borracha, movimentação e visualização do original;
- painel contextual com confiança, tamanho do pincel, suavidade e ação principal;
- botão “Remover marca d'água” como única ação dominante;
- em telas pequenas, canvas primeiro e controles essenciais logo abaixo.

### Resultado

- comparação antes/depois com divisor arrastável;
- ações de download, ajuste da máscara e nova tentativa;
- indicação do formato e resolução de saída;
- aviso visível quando a reconstrução tiver baixa confiança.

## 8. Arquitetura do sistema

O produto terá três camadas com contratos independentes:

### Interface web

Responsável por upload, edição da máscara, estados de progresso, comparação e download. Não armazena credenciais do provedor de IA.

### API segura

Responsável por validar arquivos, normalizar imagens, retirar metadados, criar trabalhos temporários, limitar requisições, orquestrar o pipeline e excluir artefatos expirados.

### Pipeline de IA

Composto por:

1. detecção de regiões que aparentam texto, logo ou sobreposição;
2. segmentação para refinar a máscara e suas bordas;
3. inpainting para reconstruir pixels usando o contexto visual ao redor.

A inferência pesada do MVP roda em GPU hospedada. Um adaptador interno isola o provedor para permitir troca por outro serviço ou infraestrutura própria sem alterar a interface pública da API.

## 9. Modelo de dados temporário

Cada trabalho contém:

- identificador aleatório não sequencial;
- estado do processamento;
- tipo, dimensões e tamanho do arquivo;
- caminho temporário do original normalizado;
- caminho temporário da máscara;
- caminho temporário do resultado;
- confiança e avisos da detecção;
- timestamps de criação e expiração.

O histórico da sessão referencia apenas trabalhos ainda válidos. A expiração remove todos os artefatos associados.

## 10. Segurança, privacidade e abuso

- validar assinatura real, limites e dimensões dos arquivos;
- decodificar e regravar imagens antes de enviá-las ao pipeline;
- remover EXIF e outros metadados desnecessários;
- nunca expor chaves do provedor no navegador;
- usar URLs temporárias e identificadores imprevisíveis;
- aplicar rate limiting por origem e sessão;
- restringir CORS e métodos HTTP;
- não registrar conteúdo de imagem em logs;
- apagar arquivos automaticamente após a janela temporária;
- registrar somente métricas operacionais sem conteúdo pessoal;
- exigir confirmação explícita de autorização para cada novo envio.

## 11. Acessibilidade e responsividade

- todos os controles funcionam por teclado;
- foco visível e ordem de navegação previsível;
- ícones acompanham rótulos textuais;
- estado não depende apenas de cor;
- canvas oferece instruções e controles equivalentes acessíveis;
- progresso é anunciado por regiões vivas sem excesso de atualizações;
- redução de movimento respeita a preferência do sistema;
- layouts serão validados de celular pequeno a desktop grande.

## 12. Estratégia de qualidade

### Testes automatizados

- validação de formatos, tamanhos e arquivos corrompidos;
- ciclo de vida de trabalhos temporários;
- serialização e edição de máscaras;
- respostas de sucesso, baixa confiança, timeout e falha do provedor;
- retomada após erro recuperável;
- autorização obrigatória;
- download e expiração do resultado;
- navegação por teclado e estados acessíveis essenciais.

### Testes visuais e funcionais

- marcas opacas, transparentes, repetidas e diagonais;
- texto pequeno e logos grandes;
- marcas sobre rostos, texturas, gradientes e fundos detalhados;
- falsos positivos envolvendo texto legítimo da cena;
- telas de celular, tablet, laptop e desktop;
- estados de carregamento, cancelamento, vazio, erro e baixa confiança.

## 13. Critérios de aceite

O MVP estará pronto quando:

1. aceitar e validar os três formatos definidos;
2. detectar automaticamente ao menos uma região provável em imagens de teste representativas;
3. permitir corrigir a máscara antes de processar;
4. produzir uma imagem realmente reconstruída pelo pipeline de inpainting;
5. permitir comparar e baixar o resultado;
6. manter credenciais e processamento sensível fora do navegador;
7. remover arquivos após a janela temporária;
8. apresentar caminhos compreensíveis para baixa confiança e falhas;
9. funcionar por teclado e responder corretamente nos tamanhos de tela definidos;
10. deixar explícito que o recurso é destinado apenas a conteúdo próprio ou autorizado.

## 14. Decisões adiadas

- escolha final do provedor hospedado e dos modelos específicos, a ser validada no planejamento técnico com documentação e disponibilidade atuais;
- duração exata da retenção temporária, definida a partir das restrições do provedor e da hospedagem;
- limites gratuitos e eventual cobrança;
- autenticação, histórico persistente e processamento em lote;
- suporte a vídeos.
