document.addEventListener('DOMContentLoaded', function () {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDu4t1Pv3EPJmEQ1X7M4UQnFkTDEdKLGJQ",
        authDomain: "amgdata-babcd.firebaseapp.com",
        projectId: "amgdata-babcd",
        storageBucket: "amgdata-babcd.appspot.com",
        messagingSenderId: "274651788012",
        appId: "1:274651788012:web:0b15bfdc54a20707c52bc9",
        measurementId: "G-8KD0QWDL5B"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();

    const loginForm = document.getElementById('login-form');
    const mainContainer = document.getElementById('main-container');
    const uploadContainer = document.getElementById('upload-container');
    const loginContainer = document.getElementById('login-container');
    const uploadForm = document.getElementById('upload-form');
    const qrCodeDiv = document.getElementById('qr-code');
    const uploadMessage = document.getElementById('upload-message');
    const pdfList = document.getElementById('pdf-list');
    const progressContainer = document.getElementById('progress-container');
    const uploadProgress = document.getElementById('upload-progress');
    const listContainer = document.getElementById('list-container');
    const searchBox = document.getElementById('search-box');
    const registroTab = document.getElementById('registro-tab');
    const listaTab = document.getElementById('lista-tab');
    const filtrosTab = document.getElementById('filtros-tab');
    const cerrarSesion = document.getElementById('cerrar-sesion');
    const filterContainer = document.getElementById('filter-container');
    const filterForm = document.getElementById('filter-form');
    const filterCareer = document.getElementById('filter-career');
    const filterSemester = document.getElementById('filter-semester');

    // Hardcoded credentials for simplicity
    const adminCredentials = {
        username: 'admin',
        password: 'password'
    };

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === adminCredentials.username && password === adminCredentials.password) {
            loginContainer.style.display = 'none';
            mainContainer.style.display = 'flex';
            mainContainer.style.flexDirection = 'column';
            mainContainer.style.height = '90vh';
        } else {
            alert('Usuario o contraseña incorrecta');
        }
    });

    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const studentName = document.getElementById('student-name').value;
        const studentSurname = document.getElementById('student-surname').value;
        const studentCareer = document.getElementById('student-career').value;
        const studentSemester = document.getElementById('student-semester').value;
        const documentNumber = document.getElementById('document-number').value;
        const studentPhone = document.getElementById('student-phone').value;
        const studentEmail = document.getElementById('student-email').value;
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (!validateEmail(studentEmail)) {
            alert('Por favor, ingrese un correo electrónico válido (@gmail.com, @yahoo.com, @outlook.com)');
            return;
        }

        if (pdfFile) {
            const storageRef = storage.ref();
            const pdfRef = storageRef.child(`pdfs/${documentNumber}.pdf`);
            const uploadTask = pdfRef.put(pdfFile);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    uploadProgress.value = progress;
                    progressContainer.style.display = 'block';
                }, 
                (error) => {
                    alert('Error al subir el archivo');
                    console.error(error);
                }, 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(async (downloadURL) => {
                        const pdfRecord = {
                            studentName,
                            studentSurname,
                            studentCareer,
                            studentSemester,
                            sequenceCode: `AVALQR-${Date.now()}`,
                            documentNumber,
                            studentPhone,
                            studentEmail,
                            pdfUrl: downloadURL
                        };

                        try {
                            await db.collection('pdfs').add(pdfRecord);
                            uploadMessage.textContent = `El estudiante ${studentName} ${studentSurname} ha sido agregado correctamente.`;
                            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pdfRecord.sequenceCode)}&size=300x300`;
                            qrCodeDiv.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code">`;
                            displayPdfList();
                            uploadForm.reset();
                            progressContainer.style.display = 'none';
                            uploadProgress.value = 0;
                        } catch (error) {
                            console.error('Error al guardar el PDF:', error);
                            alert('Error al guardar el PDF');
                        }
                    });
                }
            );
        } else {
            alert('Por favor, seleccione un archivo PDF.');
        }
    });

    async function displayPdfList(filter = '') {
        pdfList.innerHTML = '<tr><th>Nombre</th><th>Apellido</th><th>Carrera</th><th>Semestre</th><th>Código Secuencia</th><th>Número Documento</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr>';
        try {
            const snapshot = await db.collection('pdfs').get();
            snapshot.forEach((doc) => {
                const pdf = doc.data();
                const studentName = pdf.studentName.toLowerCase();
                const studentSurname = pdf.studentSurname.toLowerCase();
                const sequenceCode = pdf.sequenceCode.toLowerCase();
                const documentNumber = pdf.documentNumber.toString().toLowerCase();
                const filterLower = filter.toLowerCase();

                if (studentName.includes(filterLower) || sequenceCode.includes(filterLower) || documentNumber.includes(filterLower)) {
                    const listItem = document.createElement('tr');
                    listItem.innerHTML = `
                        <td>${pdf.studentName}</td>
                        <td>${pdf.studentSurname}</td>
                        <td>${pdf.studentCareer}</td>
                        <td>${pdf.studentSemester}</td>
                        <td>${pdf.sequenceCode}</td>
                        <td>${pdf.documentNumber}</td>
                        <td>${pdf.studentPhone}</td>
                        <td>${pdf.studentEmail}</td>
                        <td>
                            <a href="${pdf.pdfUrl}" target="_blank">Ver PDF</a>
                        </td>
                    `;
                    pdfList.appendChild(listItem);
                }
            });
        } catch (error) {
            console.error('Error al recuperar los datos:', error);
            alert('Error al recuperar los datos');
        }
    }

    function filterPdfList() {
        const career = filterCareer.value.toLowerCase();
        const semester = filterSemester.value.toLowerCase();
        pdfList.innerHTML = '<tr><th>Nombre</th><th>Apellido</th><th>Carrera</th><th>Semestre</th><th>Código Secuencia</th><th>Número Documento</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr>';
        db.collection('pdfs').get()
            .then(snapshot => {
                snapshot.forEach((doc) => {
                    const pdf = doc.data();
                    const studentCareer = pdf.studentCareer.toLowerCase();
                    const studentSemester = pdf.studentSemester.toLowerCase();

                    if ((career === '' || studentCareer.includes(career)) && (semester === '' || studentSemester.includes(semester))) {
                        const listItem = document.createElement('tr');
                        listItem.innerHTML = `
                            <td>${pdf.studentName}</td>
                            <td>${pdf.studentSurname}</td>
                            <td>${pdf.studentCareer}</td>
                            <td>${pdf.studentSemester}</td>
                            <td>${pdf.sequenceCode}</td>
                            <td>${pdf.documentNumber}</td>
                            <td>${pdf.studentPhone}</td>
                            <td>${pdf.studentEmail}</td>
                            <td>
                                <a href="${pdf.pdfUrl}" target="_blank">Ver PDF</a>
                            </td>
                        `;
                        pdfList.appendChild(listItem);
                    }
                });
            })
            .catch(error => {
                console.error('Error al recuperar los datos:', error);
                alert('Error al recuperar los datos');
            });
    }

    searchBox.addEventListener('input', function () {
        const filter = searchBox.value;
        displayPdfList(filter);
    });

    filterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        filterPdfList();
    });

    registroTab.addEventListener('click', function () {
        uploadContainer.style.display = 'block';
        listContainer.style.display = 'none';
        filterContainer.style.display = 'none';
    });

    listaTab.addEventListener('click', function () {
        uploadContainer.style.display = 'none';
        listContainer.style.display = 'block';
        filterContainer.style.display = 'none';
        displayPdfList();
    });

    filtrosTab.addEventListener('click', function () {
        uploadContainer.style.display = 'none';
        listContainer.style.display = 'none';
        filterContainer.style.display = 'block';
    });

    cerrarSesion.addEventListener('click', function () {
        mainContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        uploadForm.reset();
        qrCodeDiv.innerHTML = '';
        uploadMessage.textContent = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });

    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
        return regex.test(email);
    }

    displayPdfList();
});
