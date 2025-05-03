function calcularSubredes() {
    const red = document.getElementById("red").value;
    const numSubredes = parseInt(document.getElementById("num_subredes").value);
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = "<p>Calculando...</p>"; // Mensaje de carga

    try {
        function parsearRed(redString) {
            const parts = redString.split('/');
            if (parts.length !== 2) {
                throw new Error("Formato de red inválido. Debe ser como '192.168.1.0/24'.");
            }
            const ipString = parts[0];
            const prefixLength = parseInt(parts[1]);
            if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
                throw new Error("Longitud de prefijo inválida.");
            }
            const ipParts = ipString.split('.').map(Number);
            if (ipParts.length !== 4 || ipParts.some(isNaN) || ipParts.some(part => part < 0 || part > 255)) {
                throw new Error("Dirección IP inválida.");
            }
            let ipAddress = 0;
            for (let i = 0; i < 4; i++) {
                ipAddress = (ipAddress << 8) | ipParts[i];
            }
            return { ipAddress, prefixLength };
        }

        function calcularIncremento(nuevaMascara) {
            return Math.pow(2, 32 - nuevaMascara);
        }

        function ipIntToString(ipInt) {
            return [(ipInt >> 24) & 255, (ipInt >> 16) & 255, (ipInt >> 8) & 255, ipInt & 255].join('.');
        }

        function ipToBinaryString(ipInt) {
            return [(ipInt >> 24) & 255, (ipInt >> 16) & 255, (ipInt >> 8) & 255, ipInt & 255]
                .map(octet => octet.toString(2).padStart(8, '0'))
                .join('.');
        }

        const { ipAddress, prefixLength } = parsearRed(red);

        const bitsSubred = Math.ceil(Math.log2(numSubredes));
        const bitsHost = 32 - prefixLength;

        if (bitsSubred > bitsHost) {
            throw new Error(`No hay suficientes bits de host (${bitsHost}) para crear ${numSubredes} subredes.`);
        }

        const nuevaMascara = prefixLength + bitsSubred;
        const incremento = calcularIncremento(nuevaMascara);
        const hostsPorSubred = Math.pow(2, 32 - nuevaMascara) - 2;
        const numSubredesGeneradas = Math.pow(2, bitsSubred);
        const subredesResult = [];

        for (let i = 0; i < Math.min(numSubredes, numSubredesGeneradas); i++) {
            const networkAddressInt = ipAddress + (i * incremento);
            const broadcastAddressInt = networkAddressInt + incremento - 1;
            const primeraIPInt = networkAddressInt + 1;
            const segundaIPInt = primeraIPInt + 1;
            const ultimaIPInt = broadcastAddressInt - 1;

            subredesResult.push({
                "N° Subred": i + 1, // Iniciar desde 1
                "Dirección de Red": `${ipIntToString(networkAddressInt)}/${nuevaMascara}`,
                "Dirección de Red (Bits)": ipToBinaryString(networkAddressInt),
                "Gateway": ipIntToString(primeraIPInt),
                "1ª IP Válida": ipIntToString(segundaIPInt),
                "Última IP Válida": ipIntToString(ultimaIPInt),
                "Broadcast": ipIntToString(broadcastAddressInt),
                "Hosts por Subred": hostsPorSubred
            });
        }

        const nuevaMascaraDecimal = Array(4).fill(0);
        for (let i = 0; i < nuevaMascara; i++) {
            nuevaMascaraDecimal[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
        }
        const nuevaMascaraString = nuevaMascaraDecimal.join('.');

        let resultadosHTML = `
            <h3>Resultados para subdividir ${red} en ${subredesResult.length} subredes</h3>
            <p><strong>Bits prestados:</strong> ${bitsSubred}</p>
            <p><strong>Nueva máscara:</strong> /${nuevaMascara} (${nuevaMascaraString})</p>
            <p><strong>Incremento:</strong> ${incremento}</p>
            <p><strong>Hosts válidos por subred:</strong> ${hostsPorSubred}</p>
            <h4>Tabla de Subredes:</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>N° Subred</th>
                            <th>Dirección de Red</th>
                            <th>Dirección de Red (Bits)</th>
                            <th>Gateway</th>
                            <th>1ª IP Válida</th>
                            <th>Última IP Válida</th>
                            <th>Broadcast</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        subredesResult.forEach(subred => {
            resultadosHTML += `
                        <tr>
                            <td>${subred["N° Subred"]}</td>
                            <td>${subred["Dirección de Red"]}</td>
                            <td>${subred["Dirección de Red (Bits)"]}</td>
                            <td>${subred["Gateway"]}</td>
                            <td>${subred["1ª IP Válida"]}</td>
                            <td>${subred["Última IP Válida"]}</td>
                            <td>${subred["Broadcast"]}</td>
                        </tr>
            `;
        });

        resultadosHTML += `
                    </tbody>
                </table>
            </div>
            <div class="explanation">
                <p><strong>Explicación breve:</strong></p>
                <ul>
                    <li>Dirección de Red: Múltiplo del incremento en el último octeto</li>
                    <li>Gateway: Primera dirección IP de la subred</li>
                    <li>1ª IP Válida: Segunda dirección IP de la subred</li>
                    <li>Última IP Válida: Broadcast - 1</li>
                    <li>Cada subred tiene ${hostsPorSubred} hosts válidos (2<sup>${32 - nuevaMascara}</sup> - 2)</li>
                </ul>
            </div>
        `;

        resultadosDiv.innerHTML = resultadosHTML;

    } catch (error) {
        resultadosDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}