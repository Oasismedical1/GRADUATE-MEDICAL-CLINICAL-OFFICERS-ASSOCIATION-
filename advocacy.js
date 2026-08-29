/* ============================================================
   GMCOA-U ADVOCACY CENTRE
   Chapter 6.15
============================================================ */


/*
|--------------------------------------------------------------------------
| SUPABASE CONFIGURATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Replace these two values with the SAME Supabase URL and ANON KEY
| already used by your existing GMCOA application.
|
*/

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const { createClient } = window.supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/*
|--------------------------------------------------------------------------
| INITIALIZATION
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    loadAdvocacyStatistics();
    loadFeaturedInitiatives();
    loadInitiatives();
    loadDocuments();
    loadStakeholderEngagements();

    setupFilters();
    setupMobileMenu();

});


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

async function loadAdvocacyStatistics() {

    try {

        const { count: initiatives } =
            await supabaseClient
                .from("advocacy_initiatives")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("is_public", true);


        const { count: active } =
            await supabaseClient
                .from("advocacy_initiatives")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("is_public", true)
                .eq("status", "active");


        const { count: documents } =
            await supabaseClient
                .from("advocacy_documents")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("is_public", true)
                .eq("is_approved", true);


        const { count: engagements } =
            await supabaseClient
                .from("stakeholder_engagements")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("is_public", true);


        document.getElementById("statInitiatives").textContent =
            initiatives || 0;

        document.getElementById("statActive").textContent =
            active || 0;

        document.getElementById("statDocuments").textContent =
            documents || 0;

        document.getElementById("statEngagements").textContent =
            engagements || 0;

    } catch (error) {

        console.error(
            "Error loading advocacy statistics:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| FEATURED INITIATIVES
|--------------------------------------------------------------------------
*/

async function loadFeaturedInitiatives() {

    const container =
        document.getElementById("featuredInitiatives");

    const { data, error } =
        await supabaseClient
            .from("advocacy_initiatives")
            .select("*")
            .eq("is_public", true)
            .eq("featured", true)
            .order("created_at", {
                ascending: false
            })
            .limit(3);


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Unable to load advocacy initiatives.
             </div>`;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No featured advocacy initiatives available yet.
             </div>`;

        return;
    }


    container.innerHTML =
        data.map(renderInitiativeCard).join("");

}


/*
|--------------------------------------------------------------------------
| ALL INITIATIVES
|--------------------------------------------------------------------------
*/

async function loadInitiatives() {

    const container =
        document.getElementById("initiativesGrid");

    const search =
        document.getElementById("searchInput").value.trim();

    const status =
        document.getElementById("statusFilter").value;

    const priority =
        document.getElementById("priorityFilter").value;


    let query =
        supabaseClient
            .from("advocacy_initiatives")
            .select("*")
            .eq("is_public", true)
            .order("created_at", {
                ascending: false
            });


    if (status) {

        query = query.eq(
            "status",
            status
        );

    }


    if (priority) {

        query = query.eq(
            "priority",
            priority
        );

    }


    if (search) {

        query = query.or(
            `title.ilike.%${search}%,issue.ilike.%${search}%,objective.ilike.%${search}%`
        );

    }


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Unable to load advocacy initiatives.
             </div>`;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No advocacy initiatives found.
             </div>`;

        return;
    }


    container.innerHTML =
        data.map(renderInitiativeCard).join("");

}


/*
|--------------------------------------------------------------------------
| INITIATIVE CARD
|--------------------------------------------------------------------------
*/

function renderInitiativeCard(item) {

    const status =
        formatLabel(item.status);

    const priority =
        formatLabel(item.priority);


    return `

        <article class="initiative-card">

            <div class="badges">

                <span class="badge">
                    ${escapeHtml(status)}
                </span>

                <span class="badge priority">
                    ${escapeHtml(priority)}
                </span>

            </div>


            <h3>
                ${escapeHtml(item.title)}
            </h3>


            ${
                item.issue
                ?
                `<p>
                    <strong>Issue:</strong>
                    ${escapeHtml(item.issue)}
                </p>`
                :
                ""
            }


            ${
                item.objective
                ?
                `<p>
                    ${escapeHtml(
                        truncate(item.objective, 180)
                    )}
                </p>`
                :
                ""
            }


            <div class="progress-wrapper">

                <div class="progress-label">

                    <span>Progress</span>

                    <span>
                        ${item.progress_percentage || 0}%
                    </span>

                </div>

                <div class="progress">

                    <div
                        class="progress-bar"
                        style="width:${item.progress_percentage || 0}%">
                    </div>

                </div>

            </div>


            ${
                item.start_date
                ?
                `<small>
                    Started:
                    ${formatDate(item.start_date)}
                </small>`
                :
                ""
            }

        </article>
    `;
}


/*
|--------------------------------------------------------------------------
| DOCUMENTS
|--------------------------------------------------------------------------
*/

async function loadDocuments() {

    const container =
        document.getElementById("documentsGrid");

    const search =
        document.getElementById("documentSearch").value.trim();

    const type =
        document.getElementById("documentTypeFilter").value;


    let query =
        supabaseClient
            .from("advocacy_documents")
            .select("*")
            .eq("is_public", true)
            .eq("is_approved", true)
            .order("document_date", {
                ascending: false,
                nullsFirst: false
            });


    if (type) {

        query = query.eq(
            "document_type",
            type
        );

    }


    if (search) {

        query = query.or(
            `title.ilike.%${search}%,description.ilike.%${search}%`
        );

    }


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Unable to load documents.
             </div>`;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No advocacy documents have been published yet.
             </div>`;

        return;
    }


    container.innerHTML =
        data.map(renderDocumentCard).join("");

}


/*
|--------------------------------------------------------------------------
| DOCUMENT CARD
|--------------------------------------------------------------------------
*/

function renderDocumentCard(document) {

    return `

        <article class="document-card">

            <div class="document-type">
                ${escapeHtml(
                    formatLabel(document.document_type)
                )}
            </div>

            <h3>
                ${escapeHtml(document.title)}
            </h3>

            ${
                document.description
                ?
                `<p>
                    ${escapeHtml(
                        truncate(document.description, 160)
                    )}
                </p>`
                :
                ""
            }


            ${
                document.document_date
                ?
                `<small>
                    ${formatDate(document.document_date)}
                </small>`
                :
                ""
            }


            ${
                document.file_url
                ?
                `<p>
                    <a
                        class="btn btn-primary"
                        href="${escapeAttribute(document.file_url)}"
                        target="_blank"
                        rel="noopener noreferrer">
                        View Document
                    </a>
                </p>`
                :
                ""
            }

        </article>
    `;
}


/*
|--------------------------------------------------------------------------
| STAKEHOLDER ENGAGEMENTS
|--------------------------------------------------------------------------
*/

async function loadStakeholderEngagements() {

    const container =
        document.getElementById("engagementsGrid");


    const { data, error } =
        await supabaseClient
            .from("stakeholder_engagements")
            .select("*")
            .eq("is_public", true)
            .order("meeting_date", {
                ascending: false
            })
            .limit(9);


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Unable to load stakeholder engagements.
             </div>`;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No public stakeholder engagements available yet.
             </div>`;

        return;
    }


    container.innerHTML =
        data.map(renderEngagementCard).join("");

}


/*
|--------------------------------------------------------------------------
| ENGAGEMENT CARD
|--------------------------------------------------------------------------
*/

function renderEngagementCard(item) {

    return `

        <article class="engagement-card">

            ${
                item.meeting_date
                ?
                `<div class="engagement-date">
                    ${formatDate(item.meeting_date)}
                </div>`
                :
                ""
            }


            <h3>
                ${escapeHtml(
                    item.stakeholder_name
                )}
            </h3>


            ${
                item.institution
                ?
                `<p>
                    <strong>
                        ${escapeHtml(item.institution)}
                    </strong>
                </p>`
                :
                ""
            }


            ${
                item.purpose
                ?
                `<p>
                    ${escapeHtml(
                        truncate(item.purpose, 160)
                    )}
                </p>`
                :
                ""
            }


            ${
                item.outcome
                ?
                `<p>
                    <strong>Outcome:</strong>
                    ${escapeHtml(
                        truncate(item.outcome, 160)
                    )}
                </p>`
                :
                ""
            }

        </article>
    `;
}


/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

function setupFilters() {

    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            debounce(loadInitiatives, 400)
        );


    document
        .getElementById("statusFilter")
        .addEventListener(
            "change",
            loadInitiatives
        );


    document
        .getElementById("priorityFilter")
        .addEventListener(
            "change",
            loadInitiatives
        );


    document
        .getElementById("documentSearch")
        .addEventListener(
            "input",
            debounce(loadDocuments, 400)
        );


    document
        .getElementById("documentTypeFilter")
        .addEventListener(
            "change",
            loadDocuments
        );

}


/*
|--------------------------------------------------------------------------
| MOBILE MENU
|--------------------------------------------------------------------------
*/

function setupMobileMenu() {

    const button =
        document.getElementById("mobileMenuBtn");

    const nav =
        document.querySelector(".main-nav");


    if (!button || !nav) return;


    button.addEventListener("click", () => {

        nav.style.display =
            nav.style.display === "flex"
                ? "none"
                : "flex";

        nav.style.flexDirection = "column";
        nav.style.position = "absolute";
        nav.style.top = "78px";
        nav.style.right = "0";
        nav.style.background = "white";
        nav.style.padding = "20px";
        nav.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.1)";

    });

}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatLabel(value) {

    if (!value) return "";

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-UG",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


function truncate(text, length) {

    if (!text) return "";

    return text.length > length
        ? text.substring(0, length) + "..."
        : text;

}


function escapeHtml(value) {

    if (value === null || value === undefined)
        return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


function debounce(func, delay) {

    let timeout;

    return function () {

        clearTimeout(timeout);

        timeout = setTimeout(
            func,
            delay
        );

    };

}