# Se ejecuta asi: python3 excel2json.py



import pandas as pd
import json

def excel_a_json(archivo_excel, hoja_nombre, archivo_json):
    # Leer el Excel (Fila 7 cabeceras -> header=6)
    df = pd.read_excel(archivo_excel, sheet_name=hoja_nombre, header=6)
    
    # 1. Eliminar la columna 'nroSerie' original si existe
    if 'nroSerie' in df.columns:
        df = df.drop(columns=['nroSerie'])
    
    # 2. Renombrar 'nroSerieFake' a 'nroSerie'
    if 'nroSerieFake' in df.columns:
        df = df.rename(columns={'nroSerieFake': 'nroSerie'})
    
    # 3. Convertir columna 'foto' en un ARRAY (Lista)
    if 'foto' in df.columns:
        df['foto'] = df['foto'].apply(
            lambda x: [item.strip() for item in str(x).split(',')] if pd.notnull(x) and str(x).strip() != "-" else []
        )
    
    # 4. Limpiar columnas "Unnamed"
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    
    # 5. Formatear FECHAS a DD/MM/YYYY
    for col in df.select_dtypes(include=['datetime', 'datetimetz']).columns:
        df[col] = df[col].dt.strftime('%d/%m/%Y')

    # 6. Eliminar filas vacías y convertir NaNs a None (null en JSON)
    df = df.dropna(how='all')
    datos = df.where(pd.notnull(df), None).to_dict(orient="records")
    
    # Limpieza final: debido a cómo funciona .where con dicts, 
    # nos aseguramos de que las listas de 'foto' no se hayan convertido en None
    if 'foto' in df.columns:
        for fila in datos:
            if fila['foto'] is None: fila['foto'] = []

    with open(archivo_json, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=4)

# Configuración
excel_input = "Funkos.xlsx"
hoja = "COMPRADOS"
json_output = "Funiko_BBDD.json"

# Ejecución única
excel_a_json(excel_input, hoja, json_output)
print(f"¡Éxito! El archivo {json_output} se ha generado.")
print("- Columna 'nroSerie' eliminada.")
print("- Columna 'nroSerieFake' renombrada a 'nroSerie'.")
print("- Fechas formateadas y columnas vacías eliminadas.")
print(f"¡Listo! Columna 'foto' convertida en array y 'nroSerie' renombrada.")

