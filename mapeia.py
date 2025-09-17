import os
import json

def mapear_pasta(caminho_pasta):
    # Dicionário para armazenar a estrutura da pasta
    estrutura = {
        "nome": os.path.basename(caminho_pasta),
        "tipo": "diretorio",
        "conteudo": []
    }
    
    # Percorre todos os itens na pasta
    for item in os.listdir(caminho_pasta):
        caminho_completo = os.path.join(caminho_pasta, item)
        
        # Ignora a pasta node_modules
        if item == "node_modules":
            continue
        
        # Se for um diretório, faz a recursão
        if os.path.isdir(caminho_completo):
            subpasta = mapear_pasta(caminho_completo)
            estrutura["conteudo"].append(subpasta)
        
        # Se for um arquivo
        elif os.path.isfile(caminho_completo):
            # Verifica se é um arquivo de texto pela extensão
            extensoes_texto = ['.ejs', '.js']  # Adicione mais extensões se precisar
            if any(item.endswith(ext) for ext in extensoes_texto):
                try:
                    with open(caminho_completo, 'r', encoding='utf-8') as arquivo:
                        conteudo = arquivo.read()
                except Exception as e:
                    conteudo = f"Erro ao ler o arquivo: {str(e)}"
                
                arquivo_info = {
                    "nome": item,
                    "tipo": "arquivo",
                    "conteudo": conteudo
                }
                estrutura["conteudo"].append(arquivo_info)
    
    return estrutura

def salvar_resultado(estrutura, caminho_saida):
    # Salva o resultado em um arquivo JSON
    with open(caminho_saida, 'w', encoding='utf-8') as arquivo_saida:
        json.dump(estrutura, arquivo_saida, ensure_ascii=False, indent=4)
    print(f"Resultado salvo em: {caminho_saida}")

def main():
    # Obtém o caminho da pasta onde o script está sendo executado
    caminho_pasta = os.getcwd()
    
    # Mapeia a pasta
    resultado = mapear_pasta(caminho_pasta)
    
    # Salva o resultado em um arquivo JSON
    caminho_saida = "estrutura_projeto.json"
    salvar_resultado(resultado, caminho_saida)

if __name__ == "__main__":
    main()