import re
import os

def convert():
    sql_path = r"C:\Users\gaddi\Documents\SEIOT\seiot-frontend\database\datos_catalogo_actualizado.sql"
    output_path = r"C:\Users\gaddi\Documents\SEIOT\seiot-frontend\database\inserts_excel_psg.sql"
    
    if not os.path.exists(sql_path):
        print(f"No se encontro el archivo SQL en {sql_path}")
        return
        
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Buscar el bloque COPY public.excel_psg
    copy_pattern = re.compile(
        r"COPY public\.excel_psg \((.*?)\) FROM stdin;\n(.*?)\n\\\.", 
        re.DOTALL
    )
    
    match = copy_pattern.search(content)
    if not match:
        print("No se encontro el bloque COPY public.excel_psg en el archivo.")
        return
        
    columns_str = match.group(1)
    data_str = match.group(2)
    
    columns = [col.strip() for col in columns_str.split(',')]
    
    inserts = []
    inserts.append("BEGIN;")
    inserts.append("TRUNCATE TABLE public.excel_psg RESTART IDENTITY CASCADE;")
    
    lines = data_str.strip().split('\n')
    print(f"Procesando {len(lines)} registros...")
    
    for idx, line in enumerate(lines):
        if not line.strip():
            continue
        # Los datos del COPY FROM stdin vienen separados por tabuladores (\t)
        values = line.split('\t')
        
        # Debemos asegurarnos de que la cantidad de valores coincida con las columnas
        if len(values) != len(columns):
            print(f"Advertencia en linea {idx+1}: Coincidencia de columnas incorrecta ({len(values)} vs {len(columns)})")
            continue
            
        sql_values = []
        for val in values:
            if val == '\\N' or val == 'NULL' or val == '':
                sql_values.append("NULL")
            else:
                # Escapar comillas simples
                escaped = val.replace("'", "''")
                sql_values.append(f"'{escaped}'")
                
        cols_joined = ", ".join(columns)
        vals_joined = ", ".join(sql_values)
        inserts.append(f"INSERT INTO public.excel_psg ({cols_joined}) VALUES ({vals_joined});")
        
    inserts.append("COMMIT;")
    
    with open(output_path, 'w', encoding='utf-8') as out_f:
        out_f.write("\n".join(inserts))
        
    print(f"Listo! Guardado en {output_path}")

if __name__ == '__main__':
    convert()
