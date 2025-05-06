function calcularSubredes() {
    const red = document.getElementById("red").value;
    const numSubredes = parseInt(document.getElementById("num_subredes").value);
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Calculando...</span></div></div>`;

    try {
        function parsearRed(redString) {
            const parts = redString.split('/');
            if (parts.length !== 2) {
                throw new Error("Formato de red inválido. Debe ser como '192.168.1.0/24'.");
            }
            const ipString = parts[0];
            const prefixLength = parseInt(parts[1]);
            if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
                throw new Error("Longitud de prefijo inválida (debe ser entre 0 y 32).");
            }
            const ipParts = ipString.split('.').map(Number);
            if (ipParts.length !== 4 || ipParts.some(isNaN) || ipParts.some(part => part < 0 || part > 255)) {
                throw new Error("Dirección IP inválida. Cada octeto debe estar entre 0 y 255.");
            }
            let ipAddress = 0;
            for (let i = 0; i < 4; i++) {
                ipAddress = (ipAddress << 8) | ipParts[i];
            }
            return { ipAddress, prefixLength, ipParts };
        }

        function ipIntToString(ipInt) {
            return [(ipInt >> 24) & 255, (ipInt >> 16) & 255, (ipInt >> 8) & 255, ipInt & 255].join('.');
        }

        function to8bitBinary(num) {
            return num.toString(2).padStart(8, '0');
        }

        function mascaraBinaria(prefixLength) {
            let mascara = [];
            for (let i = 0; i < 4; i++) {
                const bits = Math.min(8, Math.max(0, prefixLength - (i * 8)));
                mascara.push('1'.repeat(bits).padEnd(8, '0'));
            }
            return mascara.join('.');
        }

        function mascaraDecimal(prefixLength) {
            const mascara = [];
            for (let i = 0; i < 4; i++) {
                const bits = Math.min(8, Math.max(0, prefixLength - (i * 8)));
                mascara.push(parseInt('1'.repeat(bits).padEnd(8, '0'), 2));
            }
            return mascara.join('.');
        }

        const { ipAddress, prefixLength, ipParts } = parsearRed(red);

        const bitsSubred = Math.ceil(Math.log2(numSubredes));
        const bitsHost = 32 - prefixLength;

        if (bitsSubred > bitsHost) {
            throw new Error(`No hay suficientes bits de host (${bitsHost}) para crear ${numSubredes} subredes.`);
        }

        const nuevaMascara = prefixLength + bitsSubred;
        const incremento = Math.pow(2, 32 - nuevaMascara);
        const hostsPorSubred = Math.pow(2, 32 - nuevaMascara) - 2;
        const numSubredesGeneradas = Math.pow(2, bitsSubred);

        const subredesResult = [];
        for (let i = 0; i < Math.min(numSubredes, numSubredesGeneradas); i++) {
            const networkAddressInt = ipAddress + (i * incremento);
            const broadcastAddressInt = networkAddressInt + incremento - 1;
            const primeraIPInt = networkAddressInt + 1;
            const ultimaIPInt = broadcastAddressInt - 1;

            subredesResult.push({
                "N° Subred": i + 1,
                "Dirección de Red": `${ipIntToString(networkAddressInt)}/${nuevaMascara}`,
                "Gateway": ipIntToString(primeraIPInt),
                "Primera IP": ipIntToString(primeraIPInt + 1),
                "Última IP": ipIntToString(ultimaIPInt),
                "Broadcast": ipIntToString(broadcastAddressInt),
                "Hosts": hostsPorSubred
            });
        }

        let stepsHTML = `
            <div class="steps">
                <h3 class="mb-4">Proceso de Cálculo Detallado</h3>
                <div class="step">
                    <h5>1. Información de la red inicial</h5>
                    <p class="mb-1"><strong>Dirección de red:</strong> ${ipParts.join('.')}</p>
                    <p class="mb-1"><strong>Máscara inicial:</strong> /${prefixLength} (${mascaraDecimal(prefixLength)})</p>
                    <p class="mb-0"><strong>Máscara en binario:</strong> <span class="binary">${mascaraBinaria(prefixLength)}</span></p>
                </div>
                <div class="step">
                    <h5>2. Cálculo de bits para subredes</h5>
                    <p>Fórmula: 2<sup>n</sup> ≥ ${numSubredes} (subredes requeridas)</p>
                    <p>Solución: n = ${bitsSubred} (porque 2<sup>${bitsSubred}</sup> = ${Math.pow(2, bitsSubred)} ≥ ${numSubredes})</p>
                    <p class="mb-0">Bits disponibles para hosts: ${bitsHost}</p>
                </div>
                <div class="step">
                    <h5>3. Nueva máscara de subred</h5>
                    <p>Máscara original: /${prefixLength}</p>
                    <p>Bits prestados para subredes: ${bitsSubred}</p>
                    <p class="mb-1"><strong>Nueva máscara:</strong> /${nuevaMascara} (${mascaraDecimal(nuevaMascara)})</p>
                    <p class="mb-0"><strong>Binario:</strong> <span class="binary">${mascaraBinaria(nuevaMascara)}</span></p>
                </div>
                <div class="step">
                    <h5>4. Hosts por subred</h5>
                    <p>Bits restantes para hosts: ${32 - nuevaMascara}</p>
                    <p class="mb-0">Fórmula: 2<sup>${32 - nuevaMascara}</sup> - 2 = <strong>${hostsPorSubred}</strong> hosts válidos por subred</p>
                </div>
                <div class="step">
                    <h5>5. Incremento entre subredes</h5>
                    <p class="mb-0">Cada subred avanza: 2<sup>${32 - nuevaMascara}</sup> = <strong>${incremento}</strong> en el último octeto</p>
                </div>
            </div>
        `;

        let tableHTML = `
            <div class="table-container">
                <h4 class="mb-3">Tabla de Subredes Generadas</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>N° Subred</th>
                                <th>Dirección de Red</th>
                                <th>Gateway</th>
                                <th>Primera IP</th>
                                <th>Última IP</th>
                                <th>Broadcast</th>
                                <th>Hosts</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        subredesResult.forEach(subred => {
            tableHTML += `
                            <tr>
                                <td>${subred["N° Subred"]}</td>
                                <td>${subred["Dirección de Red"]}</td>
                                <td>${subred["Gateway"]}</td>
                                <td>${subred["Primera IP"]}</td>
                                <td>${subred["Última IP"]}</td>
                                <td>${subred["Broadcast"]}</td>
                                <td>${subred["Hosts"]}</td>
                            </tr>
            `;
        });

        tableHTML += `
                        </tbody>
                    </table>
                </div>
                <div class="alert alert-warning mt-3">
                    <strong>Nota:</strong> El gateway es la primera IP válida de cada subred (${ipIntToString(ipAddress + 1)} en la primera subred).
                </div>
            </div>
        `;

        resultadosDiv.innerHTML = stepsHTML + tableHTML;

    } catch (error) {
        resultadosDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// Funciones para la calculadora binaria
function convertirDecimalABinario() {
    const decimalInput = document.getElementById('numeroDecimal').value;
    const resultadoBinario = document.getElementById('resultadoBinario');
    const procesoConversion = document.getElementById('procesoConversion');
    
    if (!decimalInput) {
        resultadoBinario.textContent = 'Por favor ingrese un número decimal';
        resultadoBinario.className = 'alert alert-danger';
        procesoConversion.textContent = '';
        return;
    }
    
    const decimal = parseInt(decimalInput);
    if (isNaN(decimal) || decimal < 0) {
        resultadoBinario.textContent = 'Por favor ingrese un número decimal válido (entero positivo)';
        resultadoBinario.className = 'alert alert-danger';
        procesoConversion.textContent = '';
        return;
    }
    
    let binario = '';
    let temp = decimal;
    let proceso = `Proceso de conversión de ${decimal} a binario:\n\n`;
    
    if (decimal === 0) {
        binario = '0';
        proceso += '0 en decimal es 0 en binario';
    } else {
        proceso += 'Dividir el número por 2 y registrar el residuo:\n';
        while (temp > 0) {
            const residuo = temp % 2;
            binario = residuo.toString() + binario;
            proceso += `${temp} ÷ 2 = ${Math.floor(temp / 2)} con residuo <span class="binary-step">${residuo}</span>\n`;
            temp = Math.floor(temp / 2);
        }
        proceso += `\nLeer los residuos de abajo hacia arriba: <span class="binary-step">${binario}</span>`;
    }
    
    resultadoBinario.textContent = binario;
    resultadoBinario.className = 'alert alert-info';
    procesoConversion.innerHTML = proceso;
}

function convertirBinarioADecimal() {
    const binarioInput = document.getElementById('numeroBinario').value;
    const resultadoDecimal = document.getElementById('resultadoDecimal');
    const procesoConversion = document.getElementById('procesoConversionBinario');
    
    if (!binarioInput) {
        resultadoDecimal.textContent = 'Por favor ingrese un número binario';
        resultadoDecimal.className = 'alert alert-danger';
        procesoConversion.textContent = '';
        return;
    }
    
    if (!/^[01]+$/.test(binarioInput)) {
        resultadoDecimal.textContent = 'Por favor ingrese un número binario válido (solo 0 y 1)';
        resultadoDecimal.className = 'alert alert-danger';
        procesoConversion.textContent = '';
        return;
    }
    
    let decimal = 0;
    let proceso = `Proceso de conversión de ${binarioInput} a decimal:\n\n`;
    proceso += 'Cada dígito representa una potencia de 2, empezando por la derecha (2⁰):\n';
    
    for (let i = 0; i < binarioInput.length; i++) {
        const bit = binarioInput.charAt(binarioInput.length - 1 - i);
        if (bit === '1') {
            const potencia = Math.pow(2, i);
            decimal += potencia;
            proceso += `${bit} × 2⁰ = <span class="binary-step">${potencia}</span>\n`;
        } else {
            proceso += `${bit} × 2⁰ = 0\n`;
        }
    }
    
    proceso += `\nSuma de los valores: <span class="binary-step">${decimal}</span>`;
    
    resultadoDecimal.textContent = decimal;
    resultadoDecimal.className = 'alert alert-info';
    procesoConversion.innerHTML = proceso;
}